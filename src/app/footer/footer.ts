import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  lang = inject(LangService);
  readonly year = new Date().getFullYear();

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
