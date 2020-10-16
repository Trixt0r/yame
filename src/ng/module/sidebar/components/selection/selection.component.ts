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
import { UpdateComponents, Input as InputAction } from 'ng/module/scene';
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
   * The debounce delay before data is pushed to history.
   */
  static readonly INPUT_HISTORY_DEBOUNCE: number = 150;

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

  /**
   * The current entities.
   */
  entities: SceneEntity[] = [];

  /**
   * A map for previous entity component data.
   * Needed for pushing history data.
   */
  protected previousData: { [key: string]: SceneComponent[] } = null;

  /**
   * The last input data emitted by a view component.
   */
  protected lastInputData = [];

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
    this.actions
        .pipe(ofActionSuccessful(InputAction))
        .debounceTime(SelectionComponent.INPUT_HISTORY_DEBOUNCE)
        .subscribe((action: InputAction) => {
          if (!(action.action instanceof UpdateEntity)) return;
          this.entities.forEach(entity => entity.components.set.apply(entity.components, this.previousData[entity.id]));
          this.store.dispatch(new UpdateEntity(action.action.data, 'Component update'));
          this.previousData = null;
        });
  }

  /**
   * Whether this component is visible or not.
   */
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
   * Initializes the previous data
   *
   * @param reset Whether to reset the current data.
   */
  protected initPreviousData(reset: boolean = false) {
    if (reset) this.previousData = null;
    if (!this.previousData) {
      this.previousData = { };
      this.entities.forEach(entity => this.previousData[entity.id] = entity.components.map(it => cloneDeep(it)));
    }
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
    this.lastInputData = this.entities
      .filter(entity => entity.components.byId(event.component.id))
      .map(it => ({ id: it.id, parent: it.parent, components: [ cloneDeep(event.component) ] }));
    this.initPreviousData();
    if (this.lastInputData.length > 0)
      this.store.dispatch(new InputAction(new UpdateEntity(this.lastInputData, 'Component update', false)));
  }

  /**
   * Handles the removal of a component.
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
    this.initPreviousData(true);
    if (selected && selected.components) {
      this.components = selected.components.filter((it) => !it.group);
      this.updateDirective(selected.components.slice());
    } else {
      this.components = [];
    }
  }
}
