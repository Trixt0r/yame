/**
 * Representation of a single file in the file system.
 *
 * @export
 * @interface FileContent
 */
export interface FileContent {

  /** @type {number} The last modification timestamp. */
  lastModified?: number;

  /** @type {string} The name of the file. */
  name: string;

  /** @type {string} The path of the file. */
  path: string;

  /** @type {string} The name of the file in simple form, i.e. without any extension. */
  simpleName: string;

  /** @type {number} The size of the file, in bytes. */
  size?: number;

  /** @type {string} The file type. */
  type: string;
}
