import { InvalidGroupComponentException } from '../exception/service/invalid-group-component';
import { Asset } from 'common/asset';
import { AssetGroup } from 'common/asset/group';
import { GroupComponent } from '../component/groups/component/group/abstract';
import { Injectable, Type } from '@angular/core';

/**
 * Components map definition.
 *
 * @interface Components
 */
interface Components {

  [key: string]: Type<GroupComponent>;

}

/**
 * The group component service allows you to register component classes for rendering
 * a group item in a certain way and maybe add some more functionality to a group item component.
 *
 * @export
 * @class GroupComponentService
 */
@Injectable()
export class GroupComponentService {

  // Internal map of component classes
  private components: Components = { };

  /**
   * Registers a component class for the given asset type.
   *
   * @param {string} type The asset group type. If you register a non-group asset, it will have no effect in the view.
   * @param {Type<GroupComponent>} clazz The group component class
   */
  register(type: string, clazz: Type<GroupComponent>) {
    if (!(clazz.prototype instanceof GroupComponent)) {
      throw new InvalidGroupComponentException('The group component class has to extend GroupComponent');
    }
    this.components[type] = clazz;
  }

  /**
   * Returns the group component class for the given type or asset group.
   *
   * @param {(string | AssetGroup<Asset>)} typeOrGroup
   * @returns {Type<GroupComponent>} The group component class
   */
  get(typeOrGroup: string | AssetGroup<Asset>): Type<GroupComponent> {
    return this.components[typeof typeOrGroup === 'string' ? typeOrGroup : typeOrGroup.type];
  }
}
