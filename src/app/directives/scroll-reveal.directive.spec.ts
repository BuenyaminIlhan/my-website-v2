import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RevealDirective } from './scroll-reveal.directive';
import { stubIntersectionObserver } from '../../testing/browser-stubs';
import { host } from '../../testing/fixture';

@Component({
  selector: 'app-reveal-host',
  imports: [RevealDirective],
  template: `<p [appReveal]="180">reveal me</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RevealHost {}

describe('RevealDirective', () => {
  let fixture: ComponentFixture<RevealHost>;
  let io: ReturnType<typeof stubIntersectionObserver>;

  const paragraph = (): HTMLElement => {
    const p = host(fixture).querySelector('p');
    if (!p) throw new Error('test host rendered no <p>');
    return p;
  };

  beforeEach(() => {
    io = stubIntersectionObserver();
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
  });

  afterEach(() => io.restore());

  it('observes the element it sits on', () => {
    expect(io.instances).toHaveLength(1);
    expect(io.instances[0].observed).toContain(paragraph());
  });

  it('hides the element on the first callback and applies the aliased delay', () => {
    io.triggerAll(false);

    expect(paragraph().style.opacity).toBe('0');
    expect(paragraph().style.transform).toBe('translateY(28px)');
    expect(paragraph().style.transition).toContain('180ms');
  });

  it('reveals the element once it scrolls into view, then stops observing', () => {
    io.triggerAll(false);
    io.triggerAll(true);

    expect(paragraph().style.opacity).toBe('1');
    expect(paragraph().style.transform).toBe('translateY(0)');
    expect(io.instances[0].disconnected).toBe(true);
  });

  it('leaves an element that is already visible on load untouched', () => {
    io.triggerAll(true);

    expect(paragraph().style.opacity).toBe('');
    expect(io.instances[0].disconnected).toBe(true);
  });

  it('stops observing when the host is destroyed', () => {
    fixture.destroy();

    expect(io.instances[0].disconnected).toBe(true);
  });
});
