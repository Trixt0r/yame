import { Entity } from "./entity";

/**
 * Creates a dectorator function for entity properties.
 * A property defines a field in an entity instance, which should be checked for changes on assignment and emit the
 * `change:myProperty` event if a changes happens.
 * Furthermore a property can be considered to be written to the export data on value changes.
 *
 * @param {boolean} exportData Whether to write changes into the export data
 * @returns {(target: Entity, key: string) => void} A decorator function for a single field in an entity.
 */
export function Property(exportData: boolean): (target: Entity, key: string) => void {
  return (target: Entity, key: string) => {
    let internalValue = target[key];
    const definition = {
      set: function(value) {
        if (internalValue !== value) {
          let prevVal = internalValue;
          internalValue = value;
          if (exportData)
            this.internalExportData[key] = value;
          this.emit(`change:${key}`, value, prevVal);
        }
      },
      get: () => internalValue
    };
    Object.defineProperty(target, key, definition);
  }
}
