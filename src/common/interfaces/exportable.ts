/**
 * Export options which should be a map.
 *
 * @interface ExportOptions
 */
export interface ExportOptions {
  [key: string]: any;
}

/**
 * Representation of an entity which can exported to a given type.
 */
export interface IExportable<T> {

  /**
   * Converts the instance if this interface to the type `T` and returns it.
   *
   * @param options Any export options
   * @return The exported value of this instance.
   */
  export(options?: ExportOptions): T;

}
