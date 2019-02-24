import { Entity } from './entity';

export type PropertyType = 'string' | 'number' | 'range' | 'boolean' | 'color';

export type PropertyTransform = number | ((value: any, reverse?: boolean) => any);

export interface PropertyOptions {
  export: boolean;
  transform?: PropertyTransform;
  type?: PropertyType;
  step?: number;
  min?: number;
  max?: number;
  editable?: boolean;
}

export function TransformProperty(options: PropertyOptions, value: any, reverse: boolean) {
  let val = value;
  const transform = options.transform;
  if (transform) {
    switch (typeof transform) {
      case 'function':
        val = transform(value, reverse);
        break;
      case 'number':
        val = reverse ? val / transform : val * transform;
        break;
    }
  }
  return val;
}

/**
 * Creates a dectorator function for entity properties.
 * A property defines a field in an entity instance, which should be checked for changes on assignment and emit the
 * `change:myProperty` event if changes happens.
 * Furthermore a property can be considered to be written to the export data on value changes.
 *
 * @param {boolean | PropertyType | PropertyOptions} options Whether to write changes into the export data
 * @returns {(target: Entity, key: string) => void} A decorator function for a single field in an entity.
 */
export function Property(options: boolean | PropertyType | PropertyOptions): (target: Entity, key: string) => void {
  return (target: Entity, key: string) => {
    if (typeof options === 'boolean')
      options = { export: options };
    else if (typeof options === 'string')
      options = { export: false, type: options };
    if (typeof options === 'object' && !options || options === void 0)
      options = { export: false };
    if (options.editable === void 0)
      options.editable = true;
    const exportData = options.export;
    const definition = {
      set: function(value) {
        if (!this.internalValues) this.internalValues = {};
        const internalValue = this.internalValues[key];
        if (internalValue !== value) {
          const prevVal = internalValue;
          this.internalValues[key] = value;
          if (exportData) this.internalExportData[key] = value;
          this.emit(`change:${key}`, value, prevVal);
        }
      },
      get: function() {
        if (!this.internalValues) this.internalValues = {};
        return this.internalValues[key];
      },
    };
    const obj = <any>target;
    if (!obj.internalPropertyOptions) obj.internalPropertyOptions = { };
    obj.internalPropertyOptions[key] = options;
    Object.defineProperty(target, key, definition);
  };
}
