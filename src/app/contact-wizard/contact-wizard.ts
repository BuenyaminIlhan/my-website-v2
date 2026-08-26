import { ChangeDetectionStrategy, Component, signal, computed, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { SITE_CONFIG } from '../config/site.config';

@Component({
  selector: 'app-contact-wizard',
  imports: [FormsModule],
  templateUrl: './contact-wizard.html',
  styleUrl: './contact-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactWizard {
  lang = inject(LangService);
  private inquiry = inject(InquiryService);

  readonly step        = signal<1 | 2 | 3>(1);
  readonly projectType = signal<string>('');
  readonly budget      = signal<string>('');
  readonly timeline    = signal<string>('');
  readonly details     = signal('');
  readonly name        = signal('');
  readonly email       = signal('');
  readonly message     = signal('');
  readonly honeypot    = signal('');
  readonly sending     = signal(false);
  readonly sent        = signal(false);
  readonly error       = signal(false);

  constructor() {
    effect(() => {
      const preset = this.inquiry.projectType();
      if (preset) this.projectType.set(preset);
    });
  }

  /** Localized label of the selected project type (goes into the mail as topic). */
  private readonly typeLabel = computed(() => {
    const type = this.lang.t().wizard.types.find(t => t.key === this.projectType());
    return type?.label ?? this.lang.t().contact.topicGeneral;
  });

  selectType(key: string) {
    this.projectType.set(key);
    this.step.set(2);
  }

  next() {
    this.step.update(s => (s < 3 ? ((s + 1) as 2 | 3) : s));
  }

  back() {
    this.step.update(s => (s > 1 ? ((s - 1) as 1 | 2) : s));
  }

  /** Mailto fallback with the wizard content prefilled, shown when sending fails. */
  readonly mailtoHref = computed(() => {
    const t = this.lang.t();
    const lines = [
      `${t.contact.topic}: ${this.typeLabel()}`,
      this.budget() ? `${t.wizard.budgetLabel}: ${this.budget()}` : '',
      this.timeline() ? `${t.wizard.timelineLabel}: ${this.timeline()}` : '',
      '',
      this.details(),
      this.message(),
    ].filter(Boolean);
    const subject = encodeURIComponent(t.nav.cta + ' — ' + this.typeLabel());
    const body = encodeURIComponent(lines.join('\n'));
    return `mailto:${SITE_CONFIG.email}?subject=${subject}&body=${body}`;
  });

  async send() {
    if (this.sending()) return;
    this.sending.set(true);
    this.error.set(false);

    try {
      const resp = await fetch('https://ilhan-buenyamin.com/send_mail/send_mail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          form: 'wizard',
          name: this.name(),
          email: this.email(),
          topic: this.typeLabel(),
          budget: this.budget(),
          timeline: this.timeline(),
          scope: this.details(),
          message: this.message(),
          lang: this.lang.current(),
          website: this.honeypot(),
        }).toString(),
      });

      if (resp.ok) {
        this.sent.set(true);
        this.name.set(''); this.email.set(''); this.message.set('');
        this.details.set(''); this.honeypot.set('');
        this.inquiry.projectType.set('');
      } else {
        this.error.set(true);
      }
    } catch {
      this.error.set(true);
    } finally {
      this.sending.set(false);
    }
  }

  reset() {
    this.sent.set(false);
    this.step.set(1);
    this.projectType.set('');
    this.budget.set('');
    this.timeline.set('');
  }
}
