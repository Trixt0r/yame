import {
  Component,
  ElementRef,
  NgZone,
  HostBinding,
  Input,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { ResizableComponent } from 'ng/module/utils';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { SceneComponentsService } from '../../services/scene-components.service';
import { AbstractRemoveEvent, AbstractInputEvent } from './types';
import { SceneEntity, SceneComponent } from 'common/scene';
import { ISelectState } from 'ng/module/scene/states/select.state';
import { UpdateEntity } from 'ng/module/scene/states/actions/entity.action';
import { UpdateComponents } from 'ng/module/scene';
import { EntityComponentsDirective } from '../../directives/entity-components.directive';
import { cloneDeep } from 'lodash';

/**
 * The selection component is responsible for rendering the assigned property array.
 *
 * It delegates the specific scene component rendering the `yameSceneComponents` directive.
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-selection',
  templateUrl: 'selection.component.html',
  styleUrls: ['./selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionComponent extends ResizableComponent implements OnChanges {
  /**
   * The amount to subtract from the window height on resize events.
   */
  static readonly HEIGHT_SUB: number = 100;

  /**
   * The selected state.
   */
  @Input() selected: ISelectState = { entities: [], components: [], isolated: null };

  @ViewChild(EntityComponentsDirective) entityComponentsDirective: EntityComponentsDirective;

  /**
   * The title of the component.
   */
  title: string;

  /**
   * The components to display.
   */
  components: SceneComponent[] = [];

  entities: SceneEntity[] = [];

  /**
   * The resize handler, which is bound to the scope of the component.
   */
  protected onResizeBound: EventListenerObject;

  constructor(
    public ref: ElementRef,
    protected store: Store,
    protected actions: Actions,
    protected sceneComponents: SceneComponentsService,
    protected zone: NgZone,
    protected cdr: ChangeDetectorRef
  ) {
    super(ref, zone);
    this.title = 'Properties';
    this.maxVal = window.innerHeight - SelectionComponent.HEIGHT_SUB;
    this.onResizeBound = this.onResize.bind(this);
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBound));
    this.actions
      .pipe(ofActionSuccessful(UpdateComponents))
      .subscribe((action: UpdateComponents) => this.updateDirective(action.components));
  }

  get visible(): boolean {
    return this.selected && this.selected.entities.length > 0;
  }

  /**
   * The display style of this component.
   */
  @HostBinding('style.display')
  get display(): string {
    return this.visible ? 'block' : 'none';
  }

  /**
   * Updates the max value based on the window height.
   */
  onResize(): void {
    this.maxVal = window.innerHeight - SelectionComponent.HEIGHT_SUB;
    super.onResize();
  }

  /**
   * Dispatches a property update action.
   *
   * @param event
   */
  onInput(event: AbstractInputEvent<any>): void {
    const data = this.entities
      .filter((entity) => entity.components.byId(event.component.id))
      .map((it) => ({ id: it.id, parent: it.parent, components: [ cloneDeep(event.component) ] }));
    this.store.dispatch(new UpdateEntity(data, 'Component update'));
  }

  /**
   * Handles the removal of an component.
   */
  onRemove(event: AbstractRemoveEvent) {
    this.sceneComponents.removeSceneComponent(this.entities, event.component);
  }

  updateDirective(components: SceneComponent[]) {
    if (this.entityComponentsDirective) this.entityComponentsDirective.componentsUpdate.next(components);
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes.selected) this.updateFromStyle();
    const selected = this.selected;
    const ids = this.selected ? this.selected.entities : [];
    this.entities = this.store.selectSnapshot((state) => state.scene.entities).filter((it) => ids.indexOf(it.id) >= 0);
    if (selected && selected.components) {
      this.components = selected.components.filter((it) => !it.group);
      this.updateDirective(selected.components.slice());
    } else {
      this.components = [];
    }
  }
}
