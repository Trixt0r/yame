import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { AbstractTypeComponent } from '../abstract';
import { NumberSceneComponent } from 'common/scene';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'yame-component-type-number',
    templateUrl: './number.component.html',
    styleUrls: ['../style.scss', '../inline.actions.scss', './number.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class NumberTypeComponent extends AbstractTypeComponent<NumberSceneComponent> implements OnChanges {
  static readonly type: string = 'number';

  /**
   * The value for rounding values.
   */
  decimal = 3;

  /**
   * THe current number value.
   */
  get number(): number {
    return typeof this.component?.number === 'number' ? (this.transform(this.component.number) as number) : 0;
  }

  constructor(protected translate: TranslateService, protected cdr: ChangeDetectorRef) {
    super(translate);
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: unknown): void {
    if (!this.component) return;
    const val: string | number = ((event as InputEvent).currentTarget as HTMLInputElement)!.value;
    this.component.number = this.reverse(typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val) as number;
    delete this.component.mixed;
    return super.onUpdate(event);
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    // if (this.input) this.input.stateChanges.next();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!changes.component) return;
    this.cdr.markForCheck();
  }
}
