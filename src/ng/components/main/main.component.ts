import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
    selector: 'yame-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class MainComponent implements OnChanges {
  static get DEFAULT_SIZE(): number {
    return window.innerHeight * 0.66;
  }

  @Input() width!: number;

  constructor(public ref: ElementRef, protected cdr: ChangeDetectorRef) {}

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.width) {
      this.ref.nativeElement.style.width = `${changes.width.currentValue}px`;
    }
  }
}
