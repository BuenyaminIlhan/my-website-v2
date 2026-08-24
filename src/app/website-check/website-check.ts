import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-website-check',
  imports: [FormsModule, RevealDirective],
  templateUrl: './website-check.html',
  styleUrl: './website-check.scss',
})
export class WebsiteCheck {
  lang = inject(LangService);

  url      = signal('');
  name     = signal('');
  email    = signal('');
  honeypot = signal('');
  sending  = signal(false);
  sent     = signal(false);
  error    = signal(false);

  async send() {
    if (this.sending()) return;
    this.sending.set(true);
    this.error.set(false);

    try {
      const resp = await fetch('https://ilhan-buenyamin.com/send_mail/send_mail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          form: 'website-check',
          name: this.name(),
          email: this.email(),
          url: this.url(),
          lang: this.lang.current(),
          website: this.honeypot(),
        }).toString(),
      });

      if (resp.ok) {
        this.sent.set(true);
        this.url.set(''); this.name.set(''); this.email.set('');
        this.honeypot.set('');
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
