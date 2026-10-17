import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';
import { MAIL_ENDPOINT, mailtoUrl } from '../config/site.config';

@Component({
  selector: 'app-website-check',
  imports: [FormsModule, RevealDirective, RouterLink],
  templateUrl: './website-check.html',
  styleUrl: './website-check.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteCheck {
  lang = inject(LangService);

  readonly url      = signal('');
  readonly name     = signal('');
  readonly email    = signal('');
  readonly honeypot = signal('');
  readonly sending  = signal(false);
  readonly sent     = signal(false);
  readonly error    = signal(false);

  /** Mailto fallback with the request prefilled, shown when sending fails. */
  readonly mailtoHref = computed(() => {
    const t = this.lang.t().websiteCheck;
    return mailtoUrl(`${t.title} ${t.titleAccent}`, [`${t.urlLabel}: ${this.url()}`, `${t.nameLabel}: ${this.name()}`]);
  });

  async send() {
    if (this.sending()) return;
    this.sending.set(true);
    this.error.set(false);

    try {
      const resp = await fetch(MAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          form: 'website-check',
          name: this.name(),
          email: this.email(),
          url: this.url(),
          lang: this.lang.current(),
          hp_contact_ref: this.honeypot(),
        }).toString(),
      });

      if (resp.ok) {
        this.sent.set(true);
        this.url.set(''); this.name.set(''); this.email.set('');
        this.honeypot.set('');
      } else {
        console.error('[website-check] mail endpoint answered', MAIL_ENDPOINT, resp.status);
        this.error.set(true);
      }
    } catch (err) {
      console.error('[website-check] mail endpoint unreachable', MAIL_ENDPOINT, err);
      this.error.set(true);
    } finally {
      this.sending.set(false);
    }
  }
}
