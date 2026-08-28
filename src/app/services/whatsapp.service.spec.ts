import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WhatsappService } from './whatsapp.service';
import { LangService } from './lang.service';
import { SITE_CONFIG } from '../config/site.config';

describe('WhatsappService', () => {
  let wa: WhatsappService;
  let lang: LangService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    wa = TestBed.inject(WhatsappService);
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');
  });

  it('builds a wa.me link from the configured number and the localized message', () => {
    const href = wa.href();

    expect(href.startsWith(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=`)).toBe(true);
    expect(href).toContain(encodeURIComponent(lang.t().whatsapp.prefill));
  });

  it('encodes the message so spaces and umlauts survive the URL', () => {
    const href = wa.href();

    expect(href).not.toContain(' ');
    expect(href).not.toMatch(/[äöüÄÖÜß]/);
  });

  it('re-encodes when the visitor switches language', () => {
    const german = wa.href();

    lang.applyRoute('tr', 'home');

    expect(wa.href()).not.toBe(german);
    expect(wa.href()).toContain(encodeURIComponent(lang.t().whatsapp.prefill));
  });

  it('reports availability from the configured number', () => {
    expect(wa.available).toBe(SITE_CONFIG.whatsappNumber.length > 0);
    // The number is set today; every WhatsApp affordance depends on it.
    expect(wa.available).toBe(true);
  });
});
