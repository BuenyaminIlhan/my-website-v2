import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Marquee } from './marquee';

describe('Marquee', () => {
  let fixture: ComponentFixture<Marquee>;
  const items = ['Webdesign', 'SEO', 'Redesign'];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(Marquee);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  it('repeats the items so one copy always outspans the viewport', () => {
    expect(fixture.componentInstance.copy()).toHaveLength(items.length * 4);
    expect(fixture.componentInstance.copy().slice(0, 3)).toEqual(items);
  });

  it('renders two identical copies for the seamless loop', () => {
    const el: HTMLElement = fixture.nativeElement;
    const copies = el.querySelectorAll('.marquee-copy');
    expect(copies).toHaveLength(2);
    expect(copies[0].textContent).toBe(copies[1].textContent);
  });

  it('hides the animated track from assistive tech and offers a plain-text alternative', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.marquee')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.sr-only')?.textContent).toBe('Webdesign, SEO, Redesign');
  });
});
