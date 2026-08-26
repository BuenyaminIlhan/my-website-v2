import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Stats } from './stats';
import { LangService } from '../services/lang.service';
import { stubIntersectionObserver, stubAnimationFrame } from '../../testing/browser-stubs';

describe('Stats', () => {
  let fixture: ComponentFixture<Stats>;
  let stats: Stats;
  let io: ReturnType<typeof stubIntersectionObserver>;
  let raf: ReturnType<typeof stubAnimationFrame>;

  beforeEach(() => {
    io = stubIntersectionObserver();
    raf = stubAnimationFrame();
    TestBed.configureTestingModule({});
    TestBed.inject(LangService).applyRoute('de', 'home');

    fixture = TestBed.createComponent(Stats);
    stats = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    io.restore();
    raf.restore();
  });

  it('labels each counter in the active locale', () => {
    const labels = TestBed.inject(LangService).t().stats.labels;
    expect(stats.items().map(i => i.label)).toEqual(labels.slice(0, stats.targets.length));
  });

  it('keeps the counters at zero until the section scrolls into view', () => {
    expect(stats.counters()).toEqual([0, 0, 0, 0]);

    // Several observers exist per fixture: one per appReveal element plus the
    // component's own — fire them all, none of them is intersecting yet.
    io.triggerAll(false);
    raf.flush(performance.now());

    expect(stats.counters()).toEqual([0, 0, 0, 0]);
  });

  it('counts up to the targets once visible and stops observing', () => {
    const start = performance.now();
    io.triggerAll(true);
    raf.flush(start + 5000);

    expect(stats.counters()).toEqual(stats.targets);
    expect(io.instances.some(o => o.disconnected)).toBe(true);
  });

  it('does not restart the animation on a second intersection', () => {
    io.triggerAll(true);
    raf.flush(performance.now() + 5000);

    io.triggerAll(true);
    raf.flush(performance.now() + 5000);

    expect(stats.counters()).toEqual(stats.targets);
  });
});
