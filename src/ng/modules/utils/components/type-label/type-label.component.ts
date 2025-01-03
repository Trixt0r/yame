import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SceneComponent, SceneEntity } from 'common/scene';
import { cloneDeep } from 'lodash';
import { SceneComponentsService } from 'ng/modules/sidebar/services/scene-components.service';

@Component({
    selector: 'yame-type-label',
    templateUrl: './type-label.component.html',
    styleUrls: ['./type-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class TypeLabelComponent {
  /**
   * The scene entity reference.
   */
  @Input() entities: SceneEntity[] = [];

  /**
   * The scene component reference.
   */
  @Input() component?: SceneComponent;

  /**
   * The label to display.
   */
  get label(): string {
    if (!this.component || (!this.component.id && !this.component.label)) return '';
    let found = this.translate.instant(`componentLabel.${this.component.id}`);
    if (typeof found === 'string' && found.indexOf('componentLabel.') < 0) return found;
    found = this.translate.instant(`componentLabel.${this.component.label}`);
    if (typeof found === 'string' && found.indexOf('componentLabel.') < 0) return found;
    return this.component.id;
  }

  constructor(protected components: SceneComponentsService, protected translate: TranslateService) {}

  /**
   * Handles the input change event.
   * Applies the current input value to the component id.
   *
   * @param event The triggered event.
   */
  onChange(event: InputEvent): void {
    const val = (event.currentTarget as HTMLInputElement).value;
    if (!val || !this.component) return;
    const old = cloneDeep(this.component);
    this.component.id = val;
    this.components.updateSceneComponent(this.entities, this.component, old);
  }
}
