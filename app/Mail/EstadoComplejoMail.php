<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EstadoComplejoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(protected array $data)
    {
    }

    public function envelope(): Envelope
    {
        $estadoTexto = $this->data['activo'] ? 'Reactivación de Complejo' : 'Aviso de Suspensión de Complejo';

        return new Envelope(
            from: new Address('no-reply@fulbito.com', 'Fulbito App'),
            subject: "{$estadoTexto}: " . $this->data['complejo_nombre'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.complejos.estado_complejo',
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