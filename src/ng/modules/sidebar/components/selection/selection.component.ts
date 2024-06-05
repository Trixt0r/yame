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
import { ResizableComponent } from 'ng/modules/utils';
import { Store, Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { SceneComponentsService } from '../../services/scene-components.service';
import { AbstractRemoveEvent, AbstractInputEvent } from './types/abstract';
import { SceneEntity, SceneComponent, SceneEntityData } from 'common/scene';
import { ISelectState, UpdateEntity, UpdateComponents, Input as InputAction } from 'ng/modules/scene';
import { EntityComponentsDirective } from '../../directives/entity-components.directive';
import { cloneDeep } from 'lodash';
import { debounceTime } from 'rxjs/operators';
import { SettingsState } from 'ng/modules/preferences/states/settings.state';
import { Observable } from 'rxjs';

/**
 * The selection component is responsible for rendering the assigned property array.
 *
 * It delegates the specific scene component rendering the `yameSceneComponents` directive.
 */
@Component({
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

  @ViewChild(EntityComponentsDirective) entityComponentsDirective!: EntityComponentsDirective;

  @Select(SettingsState.value('language')) language$!: Observable<string>;

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

  updateAction = new UpdateEntity([{ id: 'select', components: [] }], 'Component update');

  /**
   * A map for previous entity component data.
   * Needed for pushing history data.
   */
  protected previousData: { [key: string]: SceneComponent[] } | null = null;

  /**
   * The last input data emitted by a view component.
   */
  protected lastInputData: SceneComponent[] | null = null;

  /**
   * The resize handler, which is bound to the scope of the component.
   */
  protected onResizeBound: () => void;

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
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResizeBound);
      this.language$.subscribe(() => this.updateDirective(this.components));
    });
    this.actions
      .pipe(ofActionSuccessful(UpdateComponents))
      .subscribe((action: UpdateComponents) => this.updateDirective(action.components));
    this.actions
      .pipe(ofActionSuccessful(InputAction), debounceTime(SelectionComponent.INPUT_HISTORY_DEBOUNCE))
      .subscribe((action: InputAction) => {
        this.store.snapshot().select.components = this.previousData?.select;
        this.store.dispatch(action.actions);
        const selectComps = cloneDeep(this.store.snapshot().select.components) as SceneComponent[];
        if (this.lastInputData)
          this.lastInputData.forEach((comp) => {
            const idx = selectComps.findIndex((it) => it.id === comp.id);
            if (idx >= 0) selectComps[idx] = comp;
          });
        this.store.snapshot().select.components = selectComps;
        this.initPreviousData(true);
        this.previousData = null;
        this.lastInputData = null;
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
  protected initPreviousData(reset = false) {
    if (reset) {
      this.previousData = null;
      this.lastInputData = null;
    }
    if (!this.previousData) {
      this.previousData = {
        select: cloneDeep(this.store.snapshot().select.components),
      };
      this.entities.forEach(
        (entity) =>
          ((this.previousData as { [key: string]: SceneComponent[] })[entity.id] = cloneDeep(
            entity.components.elements.slice()
          ))
      );
    }
    if (!this.lastInputData) this.lastInputData = [];
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
  onInput(event: AbstractInputEvent<SceneComponent>): void {
    this.initPreviousData();
    const inputData = this.entities
      .filter((entity) => entity.components.byId(event.component?.id as string))
      .map((it) => ({ id: it.id, parent: it.parent, components: [cloneDeep(event.component)] }));

    const idx = this.lastInputData?.findIndex((it) => it.id === event.component?.id) as number;
    if (idx >= 0) (this.lastInputData as SceneComponent[])[idx] = cloneDeep(event.component) as SceneComponent;
    else this.lastInputData?.push(cloneDeep(event.component as SceneComponent));

    inputData.unshift({ id: 'select', parent: null, components: this.lastInputData as SceneComponent[] });
    this.entities.forEach((entity) => {
      if (!this.previousData) return;
      entity.components.set.apply(entity.components, this.previousData[entity.id]);
    });
    this.updateAction.data = inputData as Partial<SceneEntityData>[];
    this.store.dispatch(new InputAction([this.updateAction], this));
  }

  /**
   * Handles the removal of a component.
   *
   * @param event The triggered event.
   */
  onRemove(event: AbstractRemoveEvent): void {
    this.sceneComponents.removeSceneComponent(this.entities, event.component as SceneComponent);
  }

  /**
   * Performs a view update for all given scene components.
   *
   * @param components The scene components to update.
   */
  updateDirective(components: SceneComponent[]): void {
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
    this.entities = this.store
      .selectSnapshot((state) => state.scene.entities)
      .filter((it: SceneEntity) => ids.indexOf(it.id) >= 0);
    this.initPreviousData(true);
    if (selected && selected.components) {
      this.components = selected.components.filter((it) => !it.group);
      this.updateDirective(selected.components.slice());
    } else {
      this.components = [];
    }
  }
}
