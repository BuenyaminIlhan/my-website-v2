import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  lang = inject(LangService);
}
