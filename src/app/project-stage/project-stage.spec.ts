import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProjectStage, SLIDE_DWELL_MS } from './project-stage';
import { LangService } from '../services/lang.service';

describe('ProjectStage', () => {
  let fixture: ComponentFixture<ProjectStage>;
  let stage: ProjectStage;
  let lang: LangService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(ProjectStage);
    stage = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('starts on the first project', () => {
    expect(stage.activeSlide()).toBe(0);
    expect(stage.slides[0].title).toBe('Dachplaner');
  });

  it('advances to the next project after the dwell time', () => {
    vi.advanceTimersByTime(SLIDE_DWELL_MS - 1);
    expect(stage.activeSlide()).toBe(0);

    vi.advanceTimersByTime(1);
    expect(stage.activeSlide()).toBe(1);
  });

  it('wraps around to the first project', () => {
    vi.advanceTimersByTime(SLIDE_DWELL_MS * stage.slides.length);
    expect(stage.activeSlide()).toBe(0);
  });

  it('stops rotating on destroy', () => {
    const before = stage.activeSlide();
    fixture.destroy();

    vi.advanceTimersByTime(SLIDE_DWELL_MS * 5);
    expect(stage.activeSlide()).toBe(before);
  });

  it('localizes the copy of each project', () => {
    expect(stage.copyFor(stage.slides[0])).toBe(stage.slides[0].copy.de);

    lang.applyRoute('tr', 'home');
    expect(stage.copyFor(stage.slides[0])).toBe(stage.slides[0].copy.tr);
    expect(stage.copyFor(stage.slides[1])).toBe(stage.slides[1].copy.tr);
  });

  it('describes every project in all three languages', () => {
    for (const slide of stage.slides) {
      for (const lng of ['de', 'en', 'tr'] as const) {
        expect(slide.copy[lng].role.length).toBeGreaterThan(0);
        expect(slide.copy[lng].note.length).toBeGreaterThan(20);
        expect(slide.copy[lng].tags.length).toBeGreaterThan(0);
      }
    }
  });

  it('renders role, description and tags of the active project', () => {
    const host = fixture.nativeElement as HTMLElement;
    const caption = host.querySelector<HTMLElement>('.stage-caption.is-active');
    const copy = stage.copyFor(stage.slides[0]);

    expect(caption?.textContent).toContain(copy.role);
    expect(caption?.textContent).toContain(copy.note);
    for (const tag of copy.tags) {
      expect(caption?.textContent).toContain(tag);
    }
  });

  it('marks only the projects that are genuinely in use as live', () => {
    const host = fixture.nativeElement as HTMLElement;
    const pills = host.querySelectorAll('.live-pill');
    expect(pills.length).toBe(stage.slides.filter(s => s.live).length);
    expect(stage.slides.find(s => s.title === 'Dachplaner')?.live).toBe(false);
  });

  it('keeps caption and panel on the same project', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.stage-caption').length).toBe(stage.slides.length);
    expect(host.querySelectorAll('.slide').length).toBe(stage.slides.length);

    for (let i = 1; i < stage.slides.length; i++) {
      stage.advanceSlide();
      fixture.detectChanges();

      const caption = host.querySelector<HTMLElement>('.stage-caption.is-active');
      const panel = host.querySelector<HTMLImageElement>('.slide.is-active img');
      expect(caption?.textContent).toContain(stage.slides[i].title);
      expect(panel?.getAttribute('src')).toBe(stage.slides[i].image);
    }
  });

  it('shows exactly one project waiting behind the active one', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.slide.is-next').length).toBe(1);
    expect(host.querySelectorAll('.slide.is-active').length).toBe(1);
  });

  it('queues the following project, wrapping at the end', () => {
    expect(stage.nextSlide()).toBe(1);

    stage.advanceSlide();
    expect(stage.nextSlide()).toBe(2);

    stage.advanceSlide();
    expect(stage.nextSlide()).toBe(0);
  });

  it('never marks one slide as both active and next', () => {
    for (let i = 0; i < stage.slides.length; i++) {
      expect(stage.nextSlide()).not.toBe(stage.activeSlide());
      stage.advanceSlide();
    }
  });

  describe('taking over', () => {
    it('jumps to a picked project and stops the rotation for good', () => {
      stage.select(2);
      expect(stage.activeSlide()).toBe(2);
      expect(stage.autoplay()).toBe(false);

      vi.advanceTimersByTime(SLIDE_DWELL_MS * 4);
      expect(stage.activeSlide()).toBe(2);
    });

    it('steps forward and backward, wrapping in both directions', () => {
      stage.goPrev();
      expect(stage.activeSlide()).toBe(stage.slides.length - 1);

      stage.goNext();
      expect(stage.activeSlide()).toBe(0);
    });

    it('stops the rotation when an arrow is used', () => {
      stage.goNext();
      expect(stage.autoplay()).toBe(false);

      const after = stage.activeSlide();
      vi.advanceTimersByTime(SLIDE_DWELL_MS * 3);
      expect(stage.activeSlide()).toBe(after);
    });

    it('offers a control per project plus both arrows', () => {
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelectorAll('.stage-dot').length).toBe(stage.slides.length);
      expect(host.querySelectorAll('.stage-arrow').length).toBe(2);
    });

    it('stops counting down on the dash once the visitor steers', () => {
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelectorAll('.stage-dot.is-running').length).toBe(1);

      stage.goNext();
      fixture.detectChanges();
      expect(host.querySelectorAll('.stage-dot.is-running').length).toBe(0);
      expect(host.querySelectorAll('.stage-dot.is-active').length).toBe(1);
    });
  });

  it('holds on the first project when reduced motion is requested', () => {
    fixture.destroy();
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));

    const still = TestBed.createComponent(ProjectStage);
    still.detectChanges();

    vi.advanceTimersByTime(SLIDE_DWELL_MS * 4);
    expect(still.componentInstance.activeSlide()).toBe(0);
    expect(still.componentInstance.autoplay()).toBe(false);

    still.destroy();
    vi.unstubAllGlobals();
  });
});
