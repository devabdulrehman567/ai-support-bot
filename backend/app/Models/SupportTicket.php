<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    protected $fillable = [
        'customer_message',
        'category',
        'priority',
        'action',
        'ai_reason',
        'status',
    ];
}