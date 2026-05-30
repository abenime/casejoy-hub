<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all public branding settings.
     */
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update branding settings (Admin only).
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'firm_name' => 'nullable|string',
            'firm_subtitle' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'hero_title' => 'nullable|string',
            'hero_subtitle' => 'nullable|string',
            'hero_description' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value ?? '']
            );
        }

        return response()->json(['message' => 'Settings updated successfully', 'settings' => Setting::all()->pluck('value', 'key')]);
    }
}
