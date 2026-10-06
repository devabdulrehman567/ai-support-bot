<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = [
        'customer_message',
        'ai_response',
        'category',
        'priority',
        'action',
    ];
}