<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Users
Route::get('/users', function () {
    $users = DB::table('users')->get();
    foreach ($users as $user) {
        $user->caseIds = json_decode($user->caseIds);
    }
    return response()->json($users);
});

// Cases
Route::get('/cases', function () {
    return response()->json(DB::table('case_models')->get());
});

// Clients
Route::get('/clients', function () {
    return response()->json(DB::table('clients')->get());
});

// Tasks
Route::get('/tasks', function () {
    return response()->json(DB::table('tasks')->get());
});

// Events
Route::get('/events', function () {
    return response()->json(DB::table('events')->get());
});

// Documents
Route::get('/documents', function () {
    return response()->json(DB::table('documents')->get());
});

// Invoices
Route::get('/invoices', function () {
    return response()->json(DB::table('invoices')->get());
});

// Messages
Route::get('/messages', function () {
    return response()->json(DB::table('messages')->get());
});

// Analytics
Route::get('/analytics', function () {
    $frontendDataPath = base_path('../Frontend/src/data');
    return response()->json(json_decode(file_get_contents("$frontendDataPath/analytics.json")));
});
