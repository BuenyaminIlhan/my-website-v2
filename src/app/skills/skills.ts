import { Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-skills',
  imports: [],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills {
  lang = inject(LangService);

  readonly skills = [
    { name: 'Swift',           icon: 'assets/img/swift.png' },
    { name: 'Kotlin',          icon: 'assets/img/Kotlin.png' },
    { name: 'Angular',         icon: 'assets/img/Angular.svg' },
    { name: 'TypeScript',      icon: 'assets/img/TypeScript.svg' },
    { name: 'JavaScript',      icon: 'assets/img/JavaScript.svg' },
    { name: 'HTML',            icon: 'assets/img/HTML.svg' },
    { name: 'CSS',             icon: 'assets/img/CSS.svg' },
    { name: 'Firebase',        icon: 'assets/img/Firebase.svg' },
    { name: 'Git',             icon: 'assets/img/Git.svg' },
    { name: 'Scrum',           icon: 'assets/img/Scrum.svg' },
    { name: 'REST API',        icon: 'assets/img/API.svg' },
    { name: 'Material Design', icon: 'assets/img/MaterialDesign.svg' },
  ];
}
