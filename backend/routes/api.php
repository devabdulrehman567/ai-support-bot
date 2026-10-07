<?php

use App\Models\ChatMessage;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


// =============================================================
// TEST API
// =============================================================

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'AI Support Bot API is working!'
    ]);
});


// =============================================================
// GEMINI TEST
// =============================================================

Route::post('/gemini-test', function (Request $request) {

    $response = Http::withHeaders([
        'x-goog-api-key' => env('GEMINI_API_KEY'),
        'Content-Type' => 'application/json',
    ])->post(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        [
            'model' => 'gemini-flash-lite-latest',
            'input' => $request->input('message'),
        ]
    );

    $data = $response->json();

    $answer = null;

    if (isset($data['steps'])) {

        foreach ($data['steps'] as $step) {

            if (($step['type'] ?? null) === 'model_output') {

                $answer = $step['content'][0]['text'] ?? null;

                break;
            }
        }
    }

    return response()->json([
        'success' => $response->successful(),
        'message' => $answer,
    ], $response->status());
});
// =============================================================
// AI CUSTOMER SUPPORT CLASSIFICATION
// =============================================================

Route::post('/classify', function (Request $request) {

    $message = $request->input('message');


    // =========================================================
    // GEMINI AI
    // =========================================================

    $response = Http::withHeaders([
        'x-goog-api-key' => env('GEMINI_API_KEY'),
        'Content-Type' => 'application/json',
    ])->post(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        
        [
            'model' => 'gemini-flash-lite-latest',

            'system_instruction' => 'You are an AI customer support automation assistant.

Classify every customer message into exactly one category:
FAQ, ORDER, or COMPLAINT.

Priority must be exactly:
LOW, MEDIUM, or HIGH.

Choose exactly one action:
ANSWER_FAQ, CHECK_ORDER, or CREATE_TICKET.

Rules:

1. FAQ:
General questions about company policies, returns, refunds, delivery time, payment methods, etc.
Action: ANSWER_FAQ.
Priority: LOW unless the customer is clearly reporting a serious problem.

2. ORDER:
Questions about an existing order, order status, tracking, delivery, or order details.
Action: CHECK_ORDER.

3. COMPLAINT:
Damaged products, wrong products, serious complaints, refund complaints, or customer problems.
Action: CREATE_TICKET.
Damaged products and serious complaints should normally have HIGH priority.

If the category is FAQ, also provide a helpful customer-facing answer.

Return valid JSON only.',

            'input' => [
    [
        'type' => 'text',
        'text' => $message,
    ],
],

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
                                'COMPLAINT'
                            ],
                        ],

                        'priority' => [
                            'type' => 'string',
                            'enum' => [
                                'LOW',
                                'MEDIUM',
                                'HIGH'
                            ],
                        ],

                        'action' => [
                            'type' => 'string',
                            'enum' => [
                                'ANSWER_FAQ',
                                'CHECK_ORDER',
                                'CREATE_TICKET'
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
                        'answer'
                    ],
                ],
            ],
        ]
    );


    // =========================================================
    // GEMINI RESPONSE
    // =========================================================

    // GEMINI RESPONSE

$data = $response->json();

if (!$response->successful()) {
    return response()->json([
        'success' => false,
        'gemini_status' => $response->status(),
        'gemini_error' => $response->json(),
    ], $response->status());
}

$answer = null;

    if (isset($data['steps'])) {

        foreach ($data['steps'] as $step) {

            if (($step['type'] ?? null) === 'model_output') {

                $answer = $step['content'][0]['text'] ?? null;

                break;
            }
        }
    }


    // =========================================================
    // CONVERT AI JSON INTO PHP ARRAY
    // =========================================================

    $classification = $answer
        ? json_decode($answer, true)
        : null;


    // =========================================================
    // VARIABLES
    // =========================================================

    $ticket = null;

    $order = null;

    $orderNumber = null;


    // =========================================================
    // ORDER AUTOMATION
    // =========================================================

    if (
        $classification &&
        ($classification['action'] ?? null) === 'CHECK_ORDER'
    ) {

        // Customer message se order number find karo
        // Example: Mera order ORD-123 kahan hai?

        if (
            preg_match(
                '/\bORD-\d+\b/i',
                $message,
                $matches
            )
        ) {

            $orderNumber = strtoupper($matches[0]);


            // Database mein order search karo

            $order = Order::where(
                'order_number',
                $orderNumber
            )->first();
        }
    }


    // =========================================================
    // CREATE SUPPORT TICKET
    // =========================================================

    if (
        $classification &&
        ($classification['action'] ?? null) === 'CREATE_TICKET'
    ) {

        $ticket = \App\Models\SupportTicket::create([

            'customer_message' => $message,

            'category' => $classification['category'],

            'priority' => $classification['priority'],

            'action' => $classification['action'],

            'ai_reason' => $classification['reason'],

            'status' => 'OPEN',
        ]);
    }


    // =========================================================
    // SAVE CHAT HISTORY
    // =========================================================

    if ($classification) {

        ChatMessage::create([

            'customer_message' => $message,

            'ai_response' => $classification['answer'] ?? null,

            'category' => $classification['category'] ?? null,

            'priority' => $classification['priority'] ?? null,

            'action' => $classification['action'] ?? null,
        ]);
    }


    // =========================================================
    // FINAL RESPONSE
    // =========================================================

    return response()->json([

        'success' => $response->successful(),

        'classification' => $classification,

        'order_number' => $orderNumber,

        'order' => $order,

        'ticket' => $ticket,

    ], $response->status());
});


// =============================================================
// SUPPORT TICKETS
// =============================================================

Route::get('/tickets', function () {

    return response()->json([

        'success' => true,

        'tickets' => \App\Models\SupportTicket::latest()->get(),

    ]);
});


// =============================================================
// UPDATE TICKET STATUS
// =============================================================

Route::put('/tickets/{id}', function (Request $request, $id) {

    $ticket = \App\Models\SupportTicket::find($id);

    if (!$ticket) {

        return response()->json([

            'success' => false,

            'message' => 'Ticket not found.'

        ], 404);
    }


    $status = $request->input('status');


    if (!in_array($status, [

        'OPEN',

        'IN PROGRESS',

        'RESOLVED'

    ])) {

        return response()->json([

            'success' => false,

            'message' => 'Invalid ticket status.'

        ], 422);
    }


    $ticket->status = $status;

    $ticket->save();


    return response()->json([

        'success' => true,

        'message' => 'Ticket status updated successfully.',

        'ticket' => $ticket,

    ]);
});


// =============================================================
// CHAT HISTORY
// =============================================================

Route::get('/chat-history', function () {

    $messages = ChatMessage::latest()->get();

    return response()->json([

        'success' => true,

        'messages' => $messages,

    ]);
});