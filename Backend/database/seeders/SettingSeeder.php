<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'firm_name', 'value' => 'Vance & Hale'],
            ['key' => 'firm_subtitle', 'value' => 'Attorneys at Law'],
            ['key' => 'logo_url', 'value' => ''],
            ['key' => 'hero_title', 'value' => 'State-of-the-Art Advocacy.'],
            ['key' => 'hero_subtitle', 'value' => 'Unified Client Practice Management.'],
            ['key' => 'hero_description', 'value' => 'Welcome to the Vance & Hale legal platform. Access real-time case analytics, securely review and sign legal pleadings on our multi-page reader desk, exchange encrypted communications, and manage trust accounts.'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], ['value' => $setting['value']]);
        }
    }
}
