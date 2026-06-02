import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  lang = inject(LangService);

  name    = signal('');
  email   = signal('');
  message = signal('');
  sending = signal(false);
  sent    = signal(false);
  error   = signal(false);

  async sendMail() {
    if (this.sending()) return;
    this.sending.set(true);
    this.error.set(false);

    try {
      const resp = await fetch('https://ilhan-buenyamin.com/send_mail/send_mail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          name: this.name(), email: this.email(), message: this.message(),
        }).toString(),
      });

      if (resp.ok) {
        this.sent.set(true);
        this.name.set(''); this.email.set(''); this.message.set('');
      } else {
        this.error.set(true);
      }
    } catch {
      this.error.set(true);
    } finally {
      this.sending.set(false);
    }
  }
}
