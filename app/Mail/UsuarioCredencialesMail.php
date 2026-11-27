<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UsuarioCredencialesMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(protected array $data)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address('no-reply@fulbito.com', 'Fulbito App'),
            subject: $this->data['asunto'] ?? 'Credenciales de acceso - Fulbito App',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.users.usuario_credenciales',
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