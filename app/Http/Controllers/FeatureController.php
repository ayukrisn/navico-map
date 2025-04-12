<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use Inertia\Inertia;

class FeatureController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $features = Feature::where('user_id', Auth::id())->get()->pluck('feature');
        return Inertia::render('Maps', [
            'features' => $features,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'feature' => 'required|array',
            'feature.type' => 'required|in:Feature',
            'feature.geometry' => 'required|array',
            'feature.geometry.type' => 'required|string',
            'feature.geometry.coordinates' => 'required|array',
            'feature.properties' => 'nullable|array'
        ]);

        $feature = Feature::create([
            'user_id' => Auth::id(),
            'feature' => $request->input('feature'),
        ]);

        return response()->json($feature, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
