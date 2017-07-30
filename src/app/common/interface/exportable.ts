/**
 * Export options which should be a map.
 *
 * @interface ExportOptions
 */
interface ExportOptions {
  [key: string]: any;
}

/**
 * Representation of an entity which can exported to a given type.
 *
 * @export
 * @interface Exportable
 * @template T The export type.
 */
export interface Exportable<T> {

  /**
   * Converts the instance if this interface to the type `T` and returns it.
   *
   * @param {ExportOptions} [options]
   * @returns {T} The exported value of this instance.
   */
  export(options?: ExportOptions): T;

}
