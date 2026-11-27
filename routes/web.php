<?php

use App\Http\Controllers\CanchaController;
use App\Http\Controllers\ComplejoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\SuperAdminComplejoController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified', 'role:super-admin|admin|empleado'])->group(function () {
    // Dashboard unificado por rol
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Reportes Dueño (PDF y Excel con filtros)
    Route::get('/reportes/duenio/pdf', [ReportController::class, 'duenioPdf'])->name('reportes.duenio.pdf');
    Route::get('/reportes/duenio/excel', [ReportController::class, 'duenioExcel'])->name('reportes.duenio.excel');

    // Acciones y Reportes Superadmin
    Route::patch('/superadmin/complejos/{complejo}/toggle-activo', [SuperAdminComplejoController::class, 'toggleActivo'])
        ->name('superadmin.complejos.toggle');
    Route::get('/reportes/superadmin/pdf', [ReportController::class, 'superadminPdf'])->name('reportes.superadmin.pdf');
    Route::get('/reportes/superadmin/excel', [ReportController::class, 'superadminExcel'])->name('reportes.superadmin.excel');

    Route::resource('complejos', ComplejoController::class);
    Route::resource('users', UserController::class);
    Route::resource('canchas', CanchaController::class);
    Route::resource('horarios', HorarioController::class)->except(['show', 'edit', 'update']);
    Route::resource('reservas', ReservaController::class);
});

require __DIR__.'/settings.php';