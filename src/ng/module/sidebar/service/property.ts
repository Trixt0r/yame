import { Injectable, Type } from '@angular/core';
import { PropertyComponent } from '../component/property/abstract';
import { InvalidPropertyComponentException } from '../exception/service/invalid-property-component';

/**
 * Components map definition.
 *
 * @interface Components
 */
interface Components {

  [key: string]: Type<PropertyComponent>;

}

@Injectable()
export class PropertyService {

  // Internal map of component classes
  private components: Components = { };

  /**
   * Registers a component class for the given property type.
   *
   * @param {string} type The property type.
   * @param {Type<PropertyComponent>} clazz The property component class
   */
  register(type: string, clazz: Type<PropertyComponent>) {
    if (!(clazz.prototype instanceof PropertyComponent)) {
      throw new InvalidPropertyComponentException('The property component class has to extend PropertyComponent');
    }
    this.components[type] = clazz;
  }

  /**
   * Returns the property component class for the given type.
   *
   * @param {string} type
   * @returns {Type<PropertyComponent>} The property component class.
   */
  get(type: string): Type<PropertyComponent> {
    return this.components[type];
  }
}
