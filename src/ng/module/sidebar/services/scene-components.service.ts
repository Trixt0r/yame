import { Injectable, Type } from '@angular/core';
import { AbstractTypeComponent } from '../components/selection/types/abstract';
import { InvalidSceneTypeComponentException } from '../exceptions/service/invalid-property-component.exception';
import { SceneComponent, SceneEntity, createComponent, GroupSceneComponent } from 'common/scene';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { SceneComponentsServiceException } from '../exceptions/service/scene-components.exception';
import { SceneComponentService } from 'ng/module/scene/services/component.service';

/**
 * Type definition of a scene type component.
 */
export interface SceneType<T extends AbstractTypeComponent> extends Type<T> {

  /**
   * The type the component represents.
   */
  readonly type: string;
}

/**
 * Components map definition.
 */
export interface SceneTypeComponentsRegistry {
  [key: string]: Type<AbstractTypeComponent>;
}

/**
 * Definition for a scene component category.
 */
export interface SceneComponentCategory {
  /**
   * The category id.
   */
  id: string;

  /**
   * Types inside this category.
   */
  items: string[];

  /**
   * The category label.
   */
  label?: string;

  /**
   * An icon for the category.
   */
  icon?: string;

  /**
   * The parent category reference.
   */
  parent?: string;

  /**
   * Further categories inside this category.
   */
  categories?: string[];
}

/**
 * The factory function for creating a new scene component.
 */
export type factoryFn = (entities: (string | SceneEntity)[], type: string, group?: SceneComponent) => SceneComponent;

/**
 * Definition for a registry item.
 */
export interface SceneComponentItem {

  /**
   * The global unique id.
   */
  id: string;

  /**
   * The type of the item.
   */
  type: string;

  /**
   * Label to display. If omitted, the id will be displayed in capitalized form.
   */
  label?: string;

  /**
   * Icon to display in the menu.
   */
  icon?: string;

  /**
   * Optional factory function, for creating
   */
  factory?: factoryFn;
}

@Injectable({
  providedIn: 'root'
})
export class SceneComponentsService {

  /**
   * Internal map of component classes.
   */
  protected typeComponents: SceneTypeComponentsRegistry = { };

  protected _types: string[] = [];

  /**
   * Internal array for all scene component items.
   */
  protected sceneComponentItems: SceneComponentItem[] = [];

  /**
   * Internal array for all scene component categories.
   */
  protected sceneComponentCategories: SceneComponentCategory[] = [];

  /**
   * All types for which components are currently registered.
   */
  get types(): string[] {
    return this._types.slice();
  }

  /**
   * All registered scene component categories.
   */
  get categories(): SceneComponentCategory[] {
    return this.sceneComponentCategories.slice();
  }

  /**
   * All registered component items.
   */
  get items(): SceneComponentItem[] {
    return this.sceneComponentItems.slice();
  }

  /**
   * Creates a new instance of the scene component service.
   *
   * @param components The component service, for updating components.
   */
  constructor(protected components: SceneComponentService) {}

  /**
   * Registers a component class for the given property type.
   *
   * @param clazz The property component class.
   */
  registerTypeComponent(clazz: SceneType<AbstractTypeComponent>): void {
    if (!(clazz.prototype instanceof AbstractTypeComponent)) {
      throw new InvalidSceneTypeComponentException('The provided class has to extend AbstractTypeComponent');
    }
    const type = clazz.type;
    this.typeComponents[type] = clazz;
    if (this._types.indexOf(type) < 0) this._types.push(type);
  }

  registerItem(item: SceneComponentItem): void {
    const found = this.sceneComponentItems.find(it => it.id === item.id);
    if (found) return;
    this.sceneComponentItems.push(item);
  }

  /**
   *
   * @param category
   */
  registerCategory(category: SceneComponentCategory): void {
    const found = this.sceneComponentCategories.find(it => it.id === category.id);
    if (found) return;
    this.sceneComponentCategories.push(category);
  }

  /**
   * Returns the scene component item for the given id.
   *
   * @param id
   */
  getItem(id: string): SceneComponentItem {
    return this.sceneComponentItems.find(it => it.id === id);
  }

  /**
   * Returns the property component class for the given type.
   *
   * @param type
   */
  getTypeComponent(type: string): Type<AbstractTypeComponent> {
    return this.typeComponents[type] ? this.typeComponents[type] : void 0;
  }

  /**
   * Returns all categories for the given item.
   *
   * @param itemOrId The item to search for.
   */
  getCategories(itemOrId: string | SceneComponentItem): SceneComponentCategory[] {
    const item = typeof itemOrId === 'string' ? this.getItem(itemOrId) : itemOrId;
    if (!item) return [];
    const id = item.id;
    return this.sceneComponentCategories.filter(category => category.items.indexOf(id) >= 0);
  }

  /**
   * Returns all types for the given categories.
   *
   * @param category
   */
  getItems(category: string | SceneComponentCategory): string[] {
    const sceneCategory = typeof category === 'string' ? this.sceneComponentCategories.find(it => it.id === category) : category;
    if (!sceneCategory) return [];
    return sceneCategory.items.slice();
  }

  /**
   * Returns whether the given item or id can be added to the given group.
   *
   * @param group The group to check for.
   * @param itemOrId The item or id to add.
   * @return Whether the item can be added to the group.
   */
  canSceneComponentBeAddedToGroup(group: GroupSceneComponent, itemOrId: string | SceneComponentItem): boolean {
    const item = typeof itemOrId === 'string' ? this.getItem(itemOrId) : itemOrId;
    if (!item) throw new SceneComponentsServiceException('Scene component item not found ' + itemOrId);
    return this.components.canTypeBeAddedToGroup(item.type, group) && this.components.canIdBeAddedToGroup(item.id, group);
  }

  /**
   * Adds a new scene component from the given type to the given entities in the given group.
   *
   * @param entity The entity reference.
   * @param itemId The scene component id.
   * @param group Optional group, to attach the scene component to.
   * @return An observable, finishing on successful entity update.
   */
  addSceneComponent(entities: (string | SceneEntity)[], itemId: string, group?: GroupSceneComponent): Observable<any> {
    const item = this.getItem(itemId);
    if (!item) throw new SceneComponentsServiceException(`Could not find definition for id ${itemId}`);
    if (group && !this.canSceneComponentBeAddedToGroup(group, item))
      throw new SceneComponentsServiceException(`Adding item ${itemId} to group ${group.id} is not permitted.`);
    const type = item.type;
    const newComp = typeof item.factory === 'function' ?
                      item.factory(entities, type, group) :
                      createComponent(this.components.generateComponentId(entities, type), type);
    return this.components.add(entities, newComp, group);
  }

  /**
   * Updates the given component for the given entities.
   *
   * @param entities The entities to update.
   * @param component The component to update.
   * @param old The old component config.
   * @return An observable, finishing on successful entity update.
   */
  updateSceneComponent(entities: (string | SceneEntity)[], component: SceneComponent, old: SceneComponent): Observable<any> {
    return this.components.update(entities, component, old);
  }

  /**
   * Removes the given component from the given entities.
   *
   * @param entities The entities to update.
   * @param component The component to remove.
   * @return An observable, finishing on successful entity update.
   */
  removeSceneComponent(entities: (string | SceneEntity)[], component: SceneComponent): Observable<any> {
    return this.components.remove(entities, component);
  }
}
