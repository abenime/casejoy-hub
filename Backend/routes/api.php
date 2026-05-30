<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Login
Route::post('/login', function (Request $request) {
    $user = DB::table('users')
        ->where('email', $request->email)
        ->where('password', $request->password)
        ->first();

    if (!$user) {
        return response()->json(null, 401);
    }

    if (isset($user->caseIds)) {
        $user->caseIds = json_decode($user->caseIds);
    } else {
        $user->caseIds = [];
    }
    return response()->json($user);
});

// Users
Route::get('/users', function () {
    $users = DB::table('users')->get();
    foreach ($users as $user) {
        if (isset($user->caseIds)) {
            $user->caseIds = json_decode($user->caseIds);
        } else {
            $user->caseIds = [];
        }
    }
    return response()->json($users);
});

// Cases
Route::get('/cases', function () {
    return response()->json(DB::table('case_models')->get());
});

Route::get('/cases/{id}', function ($id) {
    return response()->json(DB::table('case_models')->where('id', $id)->first());
});

Route::post('/cases', function (Request $request) {
    $data = $request->all();
    DB::table('case_models')->insert($data);
    return response()->json($data, 201);
});

// Clients
Route::get('/clients', function () {
    $clients = DB::table('clients')->get();
    foreach ($clients as $client) {
        if (isset($client->notes) && is_string($client->notes)) {
            $client->notes = json_decode($client->notes);
        }
    }
    return response()->json($clients);
});

Route::post('/clients', function (Request $request) {
    $data = $request->all();
    if (isset($data['notes']) && is_array($data['notes'])) {
        $data['notes'] = json_encode($data['notes']);
    }
    DB::table('clients')->insert($data);
    return response()->json($data, 201);
});

// Tasks
Route::get('/tasks', function () {
    return response()->json(DB::table('tasks')->get());
});

Route::post('/tasks', function (Request $request) {
    $data = $request->all();
    DB::table('tasks')->insert($data);
    return response()->json($data, 201);
});

// Events
Route::get('/events', function () {
    return response()->json(DB::table('events')->get());
});

Route::post('/events', function (Request $request) {
    $data = $request->all();
    DB::table('events')->insert($data);
    return response()->json($data, 201);
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
