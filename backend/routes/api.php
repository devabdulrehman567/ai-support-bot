
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Models\ChatMessage;
use App\Models\Order;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;

/*
|--------------------------------------------------------------------------
| PUBLIC AND AUTHENTICATION ROUTES
|--------------------------------------------------------------------------
*/

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'AI Support Bot API is working!',
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/customer/profile', function (Request $request) {
        return response()->json([
            'success' => true,
            'user' => $request->user(),
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER'S OWN ORDERS
    |--------------------------------------------------------------------------
    */
 Route::middleware('auth:sanctum')->get('/customer/orders', function (Request $request) {
    $orders = Order::where('user_id', $request->user()->id)
        ->latest()
        ->get([
            'id',
            'order_number',
            'customer_name',
            'product_name',
            'amount',
            'status',
            'tracking_number',
            'created_at',
        ]);

    return response()->json([
        'success' => true,
        'orders' => $orders,
    ]);
});


    /*
    |--------------------------------------------------------------------------
    | GEMINI AI CUSTOMER SUPPORT CLASSIFICATION
    |--------------------------------------------------------------------------
    */

    Route::post('/classify', function (Request $request) {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $message = trim($validated['message']);
        $user = $request->user();
        $apiKey = config('services.gemini.api_key')
            ?: env('GEMINI_API_KEY');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Gemini API key is not configured.',
            ], 500);
        }

        /*
         * Call Gemini.
         */
        try {
            $response = Http::timeout(45)
                ->withHeaders([
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post(
                    'https://generativelanguage.googleapis.com/v1beta/interactions',
                    [
                        'model' => 'gemini-flash-lite-latest',

                        'system_instruction' => 'You are an AI customer support automation assistant.

Classify each customer message into exactly one category:
FAQ, ORDER, or COMPLAINT.

Priority must be LOW, MEDIUM, or HIGH.

Choose exactly one action:
ANSWER_FAQ, CHECK_ORDER, or CREATE_TICKET.

FAQ:
Questions about policies, refunds, returns, delivery times,
or payment methods. Action: ANSWER_FAQ.
Provide a helpful customer-facing answer.

ORDER:
Questions about an existing order, order status, tracking,
delivery, or order details. Action: CHECK_ORDER.

COMPLAINT:
Damaged products, wrong products, serious complaints,
or customer problems. Action: CREATE_TICKET.
Damaged products and serious complaints normally have HIGH priority.

Return valid JSON only.',

                        'input' => $message,

                        'response_format' => [
                            'type' => 'text',
                            'mime_type' => 'application/json',
                            'schema' => [
                                'type' => 'object',
                                'properties' => [
                                    'category' => [
                                        'type' => 'string',
                                        'enum' => [
                                            'FAQ',
                                            'ORDER',
                                            'COMPLAINT',
                                        ],
                                    ],
                                    'priority' => [
                                        'type' => 'string',
                                        'enum' => [
                                            'LOW',
                                            'MEDIUM',
                                            'HIGH',
                                        ],
                                    ],
                                    'action' => [
                                        'type' => 'string',
                                        'enum' => [
                                            'ANSWER_FAQ',
                                            'CHECK_ORDER',
                                            'CREATE_TICKET',
                                        ],
                                    ],
                                    'reason' => [
                                        'type' => 'string',
                                    ],
                                    'answer' => [
                                        'type' => 'string',
                                    ],
                                ],
                                'required' => [
                                    'category',
                                    'priority',
                                    'action',
                                    'reason',
                                    'answer',
                                ],
                            ],
                        ],
                    ]
                );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Could not connect to the AI service.',
            ], 502);
        }

        if (!$response->successful()) {
            logger()->error('Gemini API request failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The AI service returned an error.',
                'gemini_status' => $response->status(),
            ], 502);
        }

        /*
         * Extract Gemini's text response.
         */
        $data = $response->json();
        $answer = null;

        foreach (($data['steps'] ?? []) as $step) {
            if (($step['type'] ?? null) !== 'model_output') {
                continue;
            }

            foreach (($step['content'] ?? []) as $content) {
                if (
                    ($content['type'] ?? null) === 'text'
                    && isset($content['text'])
                ) {
                    $answer = $content['text'];
                    break 2;
                }
            }
        }

        $classification = is_string($answer)
            ? json_decode($answer, true)
            : null;

        $categories = ['FAQ', 'ORDER', 'COMPLAINT'];
        $priorities = ['LOW', 'MEDIUM', 'HIGH'];
        $actions = [
            'ANSWER_FAQ',
            'CHECK_ORDER',
            'CREATE_TICKET',
        ];

        if (
            !is_array($classification)
            || !in_array($classification['category'] ?? null, $categories, true)
            || !in_array($classification['priority'] ?? null, $priorities, true)
            || !in_array($classification['action'] ?? null, $actions, true)
            || !isset($classification['reason'])
            || !isset($classification['answer'])
        ) {
            return response()->json([
                'success' => false,
                'message' => 'The AI returned an invalid classification.',
            ], 502);
        }

        /*
         * Enforce the expected category/action combinations.
         */
        $expectedActions = [
            'FAQ' => 'ANSWER_FAQ',
            'ORDER' => 'CHECK_ORDER',
            'COMPLAINT' => 'CREATE_TICKET',
        ];

        if (
            $classification['action']
            !== $expectedActions[$classification['category']]
        ) {
            return response()->json([
                'success' => false,
                'message' => 'The AI returned an inconsistent classification.',
            ], 502);
        }

        $ticket = null;
        $order = null;
        $orderNumber = null;

        /*
         * Order lookup is restricted to the authenticated customer.
         */
        if ($classification['action'] === 'CHECK_ORDER') {
            if (!preg_match('/\bORD-\d+\b/i', $message, $matches)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please provide a valid order number, e.g. ORD-123.',
                ], 422);
            }

            $orderNumber = strtoupper($matches[0]);

            $order = Order::where('order_number', $orderNumber)
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found or unavailable.',
                ], 404);
            }
        }

        /*
         * Create a ticket for the current customer only.
         */
        if ($classification['action'] === 'CREATE_TICKET') {
            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'customer_message' => $message,
                'category' => $classification['category'],
                'priority' => $classification['priority'],
                'action' => $classification['action'],
                'ai_reason' => $classification['reason'],
                'status' => 'OPEN',
            ]);
        }

        /*
         * Save chat history under the current customer.
         */
        ChatMessage::create([
            'user_id' => $user->id,
            'customer_message' => $message,
            'ai_response' => $classification['answer'],
            'category' => $classification['category'],
            'priority' => $classification['priority'],
            'action' => $classification['action'],
        ]);

        return response()->json([
            'success' => true,
            'classification' => $classification,
            'order_number' => $orderNumber,
            'order' => $order ? [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'product_name' => $order->product_name,
                'amount' => $order->amount,
                'status' => $order->status,
                'tracking_number' => $order->tracking_number,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
            ] : null,
            'ticket' => $ticket,
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER'S OWN SUPPORT TICKETS
    |--------------------------------------------------------------------------
    */

    Route::get('/tickets', function (Request $request) {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'tickets' => $tickets,
        ]);
    });

    Route::put('/tickets/{id}', function (Request $request, $id) {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['OPEN', 'IN PROGRESS', 'RESOLVED']),
            ],
        ]);

        $ticket = SupportTicket::where('user_id', $request->user()->id)
            ->find($id);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found or unavailable.',
            ], 404);
        }

        $ticket->status = $validated['status'];
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket,
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER'S OWN CHAT HISTORY
    |--------------------------------------------------------------------------
    */

    Route::get('/chat-history', function (Request $request) {
        $messages = ChatMessage::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/


Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/tickets', [AdminController::class, 'tickets']);
        Route::put('/tickets/{id}', [AdminController::class, 'updateTicket']);

        // Admin can view all customer orders
        Route::get('/orders', function () {
            $orders = Order::with('user:id,name,email')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'orders' => $orders,
            ]);
        });
    });