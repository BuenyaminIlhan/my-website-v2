import { Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-about-me',
  imports: [],
  templateUrl: './about-me.html',
  styleUrl: './about-me.scss',
})
export class AboutMe {
  lang = inject(LangService);
}
