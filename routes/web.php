<?php

use App\Http\Controllers\FeatureController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');


// Maps and features
Route::get('maps', [FeatureController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('maps');

Route::post('feature', [FeatureController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('store');

    Route::put('features/{feature}', [FeatureController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('features.update');

Route::delete('features/{feature}', [FeatureController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('features.destroy');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
