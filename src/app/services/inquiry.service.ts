import { Injectable, signal } from '@angular/core';

/** Carries the project type a visitor picked (e.g. from an offer card) into the contact form. */
@Injectable({ providedIn: 'root' })
export class InquiryService {
  projectType = signal<string>('');
}
