import { Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  lang = inject(LangService);
}
