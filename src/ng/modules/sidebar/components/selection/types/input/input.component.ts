import { AbstractTypeComponent } from '../abstract';
import {
  Component,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { SceneComponent, StringSceneComponent } from 'common/scene';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'yame-component-type-string',
    templateUrl: './input.component.html',
    styleUrls: ['../style.scss', './input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class InputTypeComponent<T extends SceneComponent = SceneComponent>
  extends AbstractTypeComponent<T>
  implements OnChanges
{
  static readonly type: string = 'string';

  constructor(protected translate: TranslateService, protected cdr: ChangeDetectorRef) {
    super(translate);
  }

  /**
   * @inheritdoc
   */
  onUpdate(event: InputEvent): void {
    if (!this.component) return super.onUpdate(event);
    const comp = this.component as unknown as StringSceneComponent;
    comp.string = this.reverse((event.currentTarget as HTMLInputElement)!.value) as string;
    delete this.component?.mixed;
    return super.onUpdate(event);
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    this.cdr.markForCheck();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!changes.component) return;
    this.cdr.markForCheck();
  }
}
