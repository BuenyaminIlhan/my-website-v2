import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/* Each visual copy repeats the items enough times to always be wider
   than the viewport — the loop animation shifts by exactly one copy,
   so a shorter copy would expose a gap before the track snaps back. */
const REPEATS_PER_COPY = 4;

@Component({
  selector: 'app-marquee',
  templateUrl: './marquee.html',
  styleUrl: './marquee.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Marquee {
  readonly items = input.required<string[]>();

  readonly copy = computed(() => Array.from({ length: REPEATS_PER_COPY }, () => this.items()).flat());
}
