import * as Promise from 'bluebird';
import * as fs from 'fs';

require('./fs');

/**
 * Defines a file.
 */
export default class File {

  /** @type {number} lastModified Thhe last modification timestamp. */
  lastModified: number;

  /** @type {string} name The name of the file. */
  name: string;

  /** @type {string} path The path of the file. */
  path: string;

  /** @type {number} size The size of the file, in bytes. */
  size: number;

  /** @type {string} type The file type. */
  type: string;

  /**
   * @returns {*} A JSON representation of this file.
   */
  toJSON(): any {
    return {
      lastModified: this.lastModified,
      name: this.name,
      path: this.path,
      size: this.size,
      type: this.type
    };
  }

  /**
   * Reads the contents from disc and resolves them.
   * @param {string} [encoding]
   * @returns {(Promise<string | Buffer>)}
   */
  read(encoding?: string): Promise<string | Buffer> {
    return fs.readFileAsync(this.path, encoding);
  }

  /**
   * Writes the given data to disc and resolves if successful.
   * @param {*} data
   * @returns {Promise<void>}
   */
  write(data: any): Promise<void> {
    return fs.writeFileAsync(this.path, data);
  }
}