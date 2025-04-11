<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('maps', function () {
    return Inertia::render('Maps');
})->middleware(['auth', 'verified'])->name('maps');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
