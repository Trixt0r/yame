import { Point, Rectangle, Container, RoundedRectangle, Graphics } from 'pixi.js';
import { SceneEntity, SceneComponent, SceneEntityType, SceneComponentCollection } from 'common/scene';
import { Injectable, Inject, NgZone } from '@angular/core';
import { PixiRendererService } from '../services/renderer.service';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';
import { PixiSelectionContainerService } from './selection/container.service';
import { System } from '@trixt0r/ecs';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { cloneDeep, merge } from 'lodash';
import { SceneService, YAME_RENDERER, DeleteEntity, UpdateEntity, Select, Unselect, Input, Isolate } from 'ng/modules/scene';

const globalTopLeft = new Point();
const globalBottomRight = new Point();

class SelectInteractionSystem extends System {
  constructor(
    private service: PixiRendererService,
    priority?: number
  ) {
    super(priority);
  }

  process(): void {
    (this.service.renderer as any)._lastObjectRendered = this.service.stage;
  }
}

/**
 * The selection service reacts to the selection tool.
 * It makes sure that
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionService {
  /**
   * The top left point.
   */
  public readonly topLeft: Point = new Point();

  /**
   * The bottom right point.
   */
  public readonly bottomRight: Point = new Point();

  /**
   * Field for calculation positions between bases.
   */
  protected tmp: Point = new Point();

  /**
   * Bound double click event handler for focusing
   */
  protected onDblClickBound: (event: MouseEvent) => void;

  /**
   * The currently bound view.
   */
  protected boundView?: HTMLCanvasElement;

  /**
   * The rectangle object.
   */
  public readonly rectangle: Rectangle = new Rectangle();

  /**
   * Calculates the correct x, y, width and height properties based on the given two points.
   *
   * @param topLeft The top left point.
   * @param bottomRight The bottom right point.
   * @param target= Optional target to store the results in. E.q. your rectangle object.
   */
  static fixRectangle(topLeft: Point, bottomRight: Point, target: Rectangle = <any>{}): Rectangle {
    const x = topLeft.x < bottomRight.x ? topLeft.x : bottomRight.x;
    const y = topLeft.y < bottomRight.y ? topLeft.y : bottomRight.y;
    const width = Math.abs(topLeft.x - bottomRight.x);
    const height = Math.abs(topLeft.y - bottomRight.y);
    target.x = x;
    target.y = y;
    target.width = width;
    target.height = height;
    return target;
  }

  constructor(
    protected scene: SceneService,
    @Inject(YAME_RENDERER) public service: PixiRendererService,
    protected store: Store,
    protected actions: Actions,
    protected zone: NgZone,
    protected selectionTool: SelectionToolService,
    protected containerService: PixiSelectionContainerService
  ) {
    this.onDblClickBound = this.onDoubleClick.bind(this);
    service.init$.subscribe(() => {
      if (this.boundView === service.view) return;
      service.view?.addEventListener('dblclick', this.onDblClickBound);
      this.boundView = service.view;
    });

    zone.runOutsideAngular(() => {
      this.reset();
      service.engineService.engine.systems.add(new SelectInteractionSystem(service, 99999));

      const graphics = new Graphics();
      const config = { fill: { color: 0x0055ff, alpha: 0.25 }, line: { width: 1, color: 0x0055ff, alpha: 1 } };

      containerService.handleBegin$.subscribe(() => {
        selectionTool.handledByExternal = true;
      });
      containerService.handleEnd$.subscribe(() => {
        selectionTool.handledByExternal = false;
      });

      selectionTool.begin$.subscribe(() => {
        if (containerService.isHandling) return;
        graphics.clear();
        containerService.unselect();
        this.reset();
        this.service.stage?.toLocal(this.service.mouse, void 0, this.topLeft);
        this.bottomRight.copyFrom(this.topLeft);
        this.update();
        (this.service.stage?.getChildByName('foreground') as Container).addChild(graphics);
      });

      selectionTool.update$.subscribe(() => {
        if (containerService.isHandling) return;
        this.service.stage?.toLocal(this.service.mouse, void 0, this.bottomRight);
        this.update();
        graphics.clear();
        graphics.lineStyle(config.line.width, config.line.color, config.line.alpha);
        if (config.fill.alpha > 0) graphics.beginFill(config.fill.color, config.fill.alpha);
        graphics.drawShape(this.rectangle);
        if (config.fill.alpha > 0) graphics.endFill();
        this.service.engineService.run();
      });

      selectionTool.end$.subscribe(() => {
        if (containerService.isHandling) return;
        const entities = scene.entities.filter(it => selectionTool.isSelectable(it) && this.contains(it));
        if (entities.length === 0) {
          (this.service.stage?.getChildByName('foreground') as Container).removeChild(graphics);
          this.service.engineService.run();
          return;
        }
        selectionTool.dispatchSelect(entities.map(it => it.id), []);
      });

      actions.pipe(ofActionDispatched(DeleteEntity)).subscribe((action: DeleteEntity) => {
        this.store.dispatch(
          new Unselect(
            Array.isArray(action.id) ? action.id : [action.id],
            this.store.snapshot().select.components,
            false
          )
        );
      });

      actions.pipe(ofActionDispatched(Select, Unselect)).subscribe((action: Select | Unselect) => {
        if (action instanceof Select) {
          if (action.unselectCurrent) containerService.unselect(containerService.entities.slice(), true);
          const comps = cloneDeep(action.components.slice());
          const collection = new SceneComponentCollection(comps);
          const reset = action.persist || (collection.length === 0 && !action.persist);
          if (!reset) service.applyComponents(collection, containerService.container);
          containerService.select(
            scene.entities.filter(it => {
              return selectionTool.isSelectable(it, true) && it.type !== SceneEntityType.Layer && action.entities.indexOf(it.id) >= 0;
            }),
            false,
            reset
          );
          if (!reset) service.applyComponents(collection, containerService.container);
        } else {
          const entities = action.entities || [];
          if (entities.length === 0) containerService.unselect();
          else containerService.unselect(scene.entities.filter(it => entities.indexOf(it.id) >= 0));
        }
        (this.service.stage?.getChildByName('foreground') as Container).removeChild(graphics);
        const actionComponents = [] as SceneComponent[];
        containerService.components.forEach(comp => {
          const found = action.components.find(it => comp.id === it.id);
          if (found) actionComponents.push(merge(found, comp));
          else actionComponents.push(comp);
        });
        action.components = actionComponents;
        containerService.update$.next();
      });

      let updateSub: Subscription | null;
      containerService.selected$.subscribe(() => {
        if (updateSub) updateSub.unsubscribe();
        updateSub = actions.pipe(ofActionDispatched(Input, UpdateEntity)).subscribe((action: Input | UpdateEntity) => {
          if (action instanceof Input && action.source === this.containerService) return;
          const acts = action instanceof Input ? action.actions : [action];
          let changed = false;
          acts.forEach((act) => {
            if (!(act instanceof UpdateEntity)) return;
            const data = Array.isArray(act.data) ? act.data : [act.data];
            const found = data.find(it => it.id === 'select');
            const components = found ? found.components : null;
            if (!components || !components.find(comp => comp.id.indexOf('transformation') >= 0)) return;
            containerService.updateDispatched$.next(act);
            containerService.components.set.apply(containerService.components, components);
            containerService.applyComponents();
            if (action instanceof Input) act.data = containerService.updateEntities(false);
            else containerService.dispatchUpdate.apply(containerService, containerService.components.elements as SceneComponent[]);
            this.store.snapshot().select.components = cloneDeep(containerService.components.elements.slice());
            changed = true;
          });
          if (changed) containerService.update$.next();
        });
      });
      containerService.unselected$.subscribe(() => {
        if (containerService.entities.length > 0 || !updateSub) return;
        updateSub.unsubscribe();
        updateSub = null;
      });
    });
  }

  /**
   * Updates the current internal dimensions based on the current pixi points.
   */
  update(): Rectangle {
    PixiSelectionService.fixRectangle(this.topLeft, this.bottomRight, this.rectangle);
    return this.rectangle;
  }

  /**
   * Resets the dimensions of the internal rectangle.
   */
  reset(): void {
    this.topLeft.set(Infinity);
    this.bottomRight.set(Infinity);
    this.rectangle.width = -1;
    this.rectangle.height = -1;
  }

  /**
   * Checks whether the given entity lies within this rectangle.
   *
   * @param entity
   * @returns Whether the given entity lies in the rectangle or not.
   */
  contains(entity: SceneEntity): boolean {
    if (entity.type === SceneEntityType.Layer) return false;
    const stage = this.service.stage;
    if (!stage) return false;
    stage.toGlobal(this.topLeft, globalTopLeft);
    stage.toGlobal(this.bottomRight, globalBottomRight);
    const bounds = this.service.getShape(entity.id);
    if (this.service.containsPoint(entity.id, globalTopLeft) || this.service.containsPoint(entity.id, globalBottomRight)) return true;
    if (!bounds) return false;
    const rect = this.rectangle;
    const container = this.service.getContainer(entity.id);
    if (bounds instanceof Rectangle || bounds instanceof RoundedRectangle) {
      this.tmp.set(bounds.x, bounds.y);
      const topLeft = stage.toLocal(this.tmp, container, this.tmp);
      if (rect.contains(topLeft.x, topLeft.y)) return true;
      this.tmp.set(bounds.x + bounds.width, bounds.y);
      const topRight = stage.toLocal(this.tmp, container, this.tmp);
      if (rect.contains(topRight.x, topRight.y)) return true;
      this.tmp.set(bounds.x, bounds.y + bounds.height);
      const bottomLeft = stage.toLocal(this.tmp, container, this.tmp);
      if (rect.contains(bottomLeft.x, bottomLeft.y)) return true;
      this.tmp.set(bounds.x + bounds.width, bounds.y + bounds.height);
      const bottomRight = stage.toLocal(this.tmp, container, this.tmp);
      if (rect.contains(bottomRight.x, bottomRight.y)) return true;
    }
    return false;
  }

  /**
   * Handles the double click event, i.e. focuses the double clicked group.
   */
  onDoubleClick(): void {
    const found = this.containerService.entities.find(it => this.service.containsPoint(it.id, this.service.mouse));
    if (found && found.children.length > 0) this.store.dispatch(new Isolate(found));
    else if (!found) this.store.dispatch(new Isolate(null));
  }
}
