import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-legal-notice',
  imports: [RouterLink],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  lang = inject(LangService);
}
