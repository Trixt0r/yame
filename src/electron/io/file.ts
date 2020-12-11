import { Stats } from 'fs-extra';
import * as path from 'path';

import { FileContent } from '../../common/content/file';
import { Exportable } from '../../common/interface/exportable';


/**
 * A file represents a file in the file system.
 *
 * An instance is able to read the contents of the file in the fs and write content to it back.
 */
export class File implements FileContent, Exportable<FileContent> {

  /** @type The last modification timestamp. */
  lastModified!: number;

  /** @type The name of the file. */
  name!: string;

  /** @type The path of the file. */
  path!: string;

  /** @type The name of the file in simple form, i.e. without any extension. */
  simpleName!: string;

  /** @type The size of the file, in bytes. */
  size!: number;

  /** @type The file type. */
  type!: string;

  constructor(filePath?: string) {
    if (filePath) {
      this.path = filePath;
      let ext = path.extname(this.path);
      this.type = ext.replace('.', '');
      this.name = path.basename(this.path);
      this.simpleName = path.basename(this.path, ext);
    }
  }

  /**
   * @return A JSON representation of this file.
   */
  export(): FileContent {
    return {
      lastModified: this.lastModified,
      name: this.name,
      path: this.path,
      simpleName: this.simpleName,
      size: this.size,
      type: this.type
    };
  }

  /**
   * Reads the content from disc and resolves it.
   *
   * @param encoding
   * @param stats Whether to read the file stats too.
   * @returns The file content.
   */
  read(encoding = 'utf8', stats = false): Promise<string | Buffer> {
    return require('fs-extra').readFile(this.path, encoding).then((re: string | Buffer) => {
      if (stats)
        return require('fs-extra').stat(this.path).then((stats: Stats) => {
          this.lastModified = stats.mtime.getTime();
          this.size = stats.size;
          return re;
        });
      else
        return re;
    });
  }

  /**
   * Writes the given data to disc and resolves if successful.
   * @param {*} data
   * @returns {Promise<void>}
   */
  write(data: any): Promise<void> {
    return require('fs-extra').writeFile(this.path, data);
  }

}
