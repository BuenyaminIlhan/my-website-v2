import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WhatsappButton } from './whatsapp-button';
import { LangService } from '../services/lang.service';
import { WhatsappService } from '../services/whatsapp.service';

describe('WhatsappButton', () => {
  let fixture: ComponentFixture<WhatsappButton>;
  let button: WhatsappButton;
  let lang: LangService;

  const scrollTo = (y: number) => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    window.dispatchEvent(new Event('scroll'));
  };

  beforeEach(async () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(WhatsappButton);
    button = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    vi.restoreAllMocks();
  });

  it('links to WhatsApp with the shared service href', () => {
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('.wa-fab');

    expect(link?.getAttribute('href')).toBe(TestBed.inject(WhatsappService).href());
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(link?.getAttribute('target')).toBe('_blank');
  });

  it('starts as a labelled pill so the channel is unmissable', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(button.collapsed()).toBe(false);
    expect(el.querySelector('.wa-label')?.textContent?.trim()).toBe(lang.t().whatsapp.short);
    expect(el.querySelector('.wa-fab')?.classList.contains('collapsed')).toBe(false);
  });

  it('collapses to a circle once the visitor is past the first screen', () => {
    scrollTo(1000);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(button.collapsed()).toBe(true);
    expect(el.querySelector('.wa-fab')?.classList.contains('collapsed')).toBe(true);
  });

  /* Pins the threshold itself: at 800px viewport height it flips between
     719 and 721 px of scroll. Without this, moving 0.9 to any other factor
     went unnoticed. */
  it('flips exactly at 90 % of the first screen', () => {
    scrollTo(719);
    fixture.detectChanges();
    expect(button.collapsed()).toBe(false);

    scrollTo(721);
    fixture.detectChanges();
    expect(button.collapsed()).toBe(true);
  });

  it('expands again when the visitor scrolls back to the top', () => {
    scrollTo(1000);
    fixture.detectChanges();
    scrollTo(0);
    fixture.detectChanges();

    expect(button.collapsed()).toBe(false);
  });

  it('stops listening to scroll once destroyed', () => {
    const remove = vi.spyOn(window, 'removeEventListener');

    fixture.destroy();

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('carries a localized accessible name — the mark alone says nothing to a screen reader', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.wa-fab')?.getAttribute('aria-label')).toBe(lang.t().whatsapp.aria);
    expect(el.querySelector('.wa-fab svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
