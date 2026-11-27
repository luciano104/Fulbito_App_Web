<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReservaEstadoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(protected array $data)
    {
    }

    public function envelope(): Envelope
    {
        $asunto = match ($this->data['estado']) {
            'confirmada' => "Tu reserva #{$this->data['reserva_id']} ha sido confirmada",
            'cancelada'  => "Tu reserva #{$this->data['reserva_id']} ha sido cancelada",
            default      => "Hemos registrado tu reserva #{$this->data['reserva_id']} (Pendiente)",
        };

        return new Envelope(
            from: new Address(
                config('mail.from.address', 'noreply@example.com'),
                config('mail.from.name', 'Sistema de Reservas')
            ),
            subject: $asunto,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reservas.estado_reserva',
            with: [
                'data' => $this->data,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}