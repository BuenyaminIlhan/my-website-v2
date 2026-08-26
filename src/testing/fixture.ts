import { ComponentFixture } from '@angular/core/testing';

/** `fixture.nativeElement` is typed `any`; these keep the specs type-safe. */
export const host = (fixture: ComponentFixture<unknown>): HTMLElement => fixture.nativeElement as HTMLElement;

/** Rendered text of a fixture, for asserting that a locale actually reached the DOM. */
export const text = (fixture: ComponentFixture<unknown>): string => host(fixture).textContent ?? '';
