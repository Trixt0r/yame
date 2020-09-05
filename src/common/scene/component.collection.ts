import { merge, isEqual, cloneDeep } from 'lodash';
import { ComponentCollection, CollectionListener } from '@trixt0r/ecs';
import { SceneComponent } from './component';
import { GroupSceneComponent, getMemberComponents } from './component/group';

export interface SceneComponentCollectionListener extends CollectionListener<SceneComponent> {
  /**
   * Called as soon as the value of the given entities got updated.
   *
   * @param elements A list of updated components.
   */
  onUpdated(...elements: []): void;
}

export class SceneComponentCollection<T extends SceneComponent> extends ComponentCollection<T> {

  /**
   * Returns the component with the given id.
   *
   * @param id The id to search for.
   * @return The found component or `undefined`.
   */
  byId(id: string): SceneComponent {
    return this.find(comp => comp.id === id);
  }

  /**
   * Returns all components for the given type.
   *
   * @param type The type to search for.
   * @return All components matching the given type.
   */
  byType(type: string): SceneComponent[] {
    return this.filter(comp => comp.type === type);
  }

  /**
   * Returns the value of the component with the given id.
   *
   * @param id The component id.
   * @param key The key to lookup in the found component.
   * @param dflt Optional default value if the component could not be found or the value is `undefined`.
   */
  getValue<T>(id: string, key = 'value', dflt?: T): T {
    const comp = this.byId(id);
    return comp ? comp[key] === void 0 ? dflt : comp[key] as T : dflt;
  }

  /**
   *
   * @param component
   */
  protected getChildren(component: GroupSceneComponent) {
    return getMemberComponents(component, this.elements, true);
  }

  /**
   * Sets the given data in this component collection.
   * Note that this method will figure out on its own whether to add, update or remove the given component data.
   *
   * @param components The data to set.
   */
  async set(...components: SceneComponent[]) {
    const toAdd: SceneComponent[] = [];
    const toRemove: SceneComponent[] = [];
    const toUpdate: SceneComponent[] = [];
    for (let i = 0, l = components.length; i < l; i++) {
      const comp = components[i];
      const found = comp.id ? this.find(it => it.id === comp.id) : this.find(it => it.type === comp.type);
      if (!found && comp.markedForDelete !== true) toAdd.push(cloneDeep(comp));
      else if (found && comp.markedForDelete === true) {
        if (found.type === 'group') {
          this.getChildren(found as unknown as GroupSceneComponent).forEach(it => toRemove.push(it));
        }
        if (found.group) {
          const group = this.find(g => g.id === found.group);
          if (group) {
            const members = (group as unknown as GroupSceneComponent).members;
            if (Array.isArray(members)) {
              const idx = members.indexOf(found.id);
              if (idx >= 0) members.splice(idx, 1);
            }
          }
        }
        toRemove.push(found);
      } else if (found && !isEqual(found, comp)) {
        merge(found, comp);
        toUpdate.push(found);
      }
    }
    if (toAdd.length > 0)
      this.add.apply(this, toAdd);
    if (toUpdate.length > 0) {
      this.updatedFrozenObjects();
      this.dispatch.apply(this, ['onUpdated', ...toUpdate]);
    }
    if (toRemove.length > 0)
      this.remove.apply(this, toRemove);
  }

}
