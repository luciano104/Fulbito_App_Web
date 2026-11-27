<?php

namespace Database\Seeders;

use App\Models\Resenia;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            ComplejoSeeder::class,
            CanchaSeeder::class,
            HorarioSeeder::class,
            ReservaSeeder::class,
            ReseniaSeeder::class,
        ]);
    }
}
