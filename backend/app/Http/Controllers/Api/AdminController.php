<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function tickets()
    {
        return response()->json([
            'success' => true,
            'tickets' => SupportTicket::with('user:id,name,email')
                ->latest()
                ->get(),
        ]);
    }

    public function updateTicket(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in(['OPEN', 'IN PROGRESS', 'RESOLVED']),
            ],
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $ticket->status = $validated['status'];
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket->load('user:id,name,email'),
        ]);
    }
}
