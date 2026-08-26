import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Skills } from './skills';
import { LangService } from '../services/lang.service';
import { stubIntersectionObserver, stubAnimationFrame } from '../../testing/browser-stubs';

describe('Skills', () => {
  let fixture: ComponentFixture<Skills>;
  let skills: Skills;
  let io: ReturnType<typeof stubIntersectionObserver>;
  let raf: ReturnType<typeof stubAnimationFrame>;

  beforeEach(() => {
    io = stubIntersectionObserver();
    raf = stubAnimationFrame();
    TestBed.configureTestingModule({});
    TestBed.inject(LangService).applyRoute('de', 'home');

    fixture = TestBed.createComponent(Skills);
    skills = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    io.restore();
    raf.restore();
  });

  it('starts every bar collapsed', () => {
    expect(skills.barWidths()).toHaveLength(skills.allLevels.length);
    expect(skills.barWidths().every(w => w === 0)).toBe(true);
    expect(skills.webWidth(0)).toBe(0);
  });

  it('animates the bars to their skill levels once visible', () => {
    // Several observers exist per fixture: one per appReveal element plus the
    // component's own — fire them all.
    io.triggerAll(true);
    raf.flush(performance.now() + 5000);

    expect(skills.barWidths()).toEqual(skills.allLevels);
    expect(skills.webWidth(0)).toBe(skills.web[0].level);
    expect(skills.mobileWidth(0)).toBe(skills.mobile[0].level);
    expect(io.instances.some(o => o.disconnected)).toBe(true);
  });

  it('reports 0 for a bar index that does not exist', () => {
    expect(skills.webWidth(99)).toBe(0);
    expect(skills.mobileWidth(99)).toBe(0);
  });

  it('leaves the bars alone while the section is out of view', () => {
    io.triggerAll(false);
    raf.flush(performance.now() + 5000);

    expect(skills.barWidths().every(w => w === 0)).toBe(true);
  });
});
