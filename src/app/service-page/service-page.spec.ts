import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ServicePage } from './service-page';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { text } from '../../testing/fixture';

describe('ServicePage', () => {
  let fixture: ComponentFixture<ServicePage>;
  let lang: LangService;

  const mount = (slug: string) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { slug } } } }],
    });
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', slug as never);

    fixture = TestBed.createComponent(ServicePage);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('renders the service the route points at', () => {
    mount('web-app-entwicklung');

    const content = lang.t().servicePages['web-app-entwicklung'];
    expect(fixture.componentInstance.content()).toBe(content);
    expect(text(fixture)).toContain(content.h1);
  });

  it('sets the page title from the service content', () => {
    mount('website-optimierung');

    expect(TestBed.inject(Title).getTitle()).toBe(lang.t().servicePages['website-optimierung'].metaTitle);
  });

  it('follows a language switch', () => {
    mount('sorglos-paket');

    lang.applyRoute('tr', 'sorglos-paket');
    fixture.detectChanges();

    expect(fixture.componentInstance.content()).toBe(lang.t().servicePages['sorglos-paket']);
  });

  it('prefills the contact wizard with the matching project type', () => {
    mount('website-erstellen-lassen');

    fixture.componentInstance.prefillContact();

    expect(TestBed.inject(InquiryService).projectType()).toBe('website');
  });

  it('leaves the project type empty for a slug the wizard does not know', () => {
    mount('website-erstellen-lassen');
    fixture.componentInstance.slug = 'not-an-offer';

    fixture.componentInstance.prefillContact();

    expect(TestBed.inject(InquiryService).projectType()).toBe('');
  });
});
