import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { SceneComponent } from '../../modules/scene/components/scene/scene.component';
import { ToolbarComponent } from 'ng/modules/toolbar/components/toolbar/toolbar.component';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-main',
  templateUrl: 'main.component.html',
  styleUrls: ['main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnChanges {
  static get DEFAULT_SIZE(): number {
    return window.innerHeight * 0.66;
  }

  @Input() width!: number;

  @ViewChild(SceneComponent, { static: false }) scene!: SceneComponent;
  @ViewChild(ToolbarComponent, { static: false }) toolbar!: ToolbarComponent;

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
