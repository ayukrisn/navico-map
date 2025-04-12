<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feature extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'feature'];

    protected $casts = [
        'feature' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
