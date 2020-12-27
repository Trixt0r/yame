import { Stats } from 'fs-extra';
import * as path from 'path';

import { IExportable } from 'common/interfaces/exportable';
import { IResource } from 'common/interfaces/resource';


/**
 * A file represents a file in the file system.
 *
 * An instance is able to read the contents of the file in the fs and write content to it back.
 */
export class File implements IResource<string | Buffer>, IExportable<IResource> {

  /**
   * The uri of the file.
   */
  uri: string;

  /**
   * The name of the file.
   */
  name: string;

  /**
   * The file type.
   */
  type: string;

  /**
   * The source.
   */
  source = 'local';

  /**
   * The name of the file without any extension.
   */
  label: string;

  /**
   * The creation timestamp.
   */
  created?: number;

  /**
   * The last modification timestamp.
   */
  changed?: number;

  /**
   * The size of the file, in bytes.
   */
  size?: number;

  /**
   * The file content.
   */
  data?: string | Buffer;

  constructor(filePath: string) {
    this.uri = filePath;
    let ext = path.extname(this.uri);
    this.type = ext.replace('.', '');
    this.name = path.basename(this.uri);
    this.label = path.basename(this.uri, ext);
  }

  /**
   * @return A JSON representation of this file.
   */
  export(): IResource {
    return {
      uri: 'file:///' + this.uri,
      name: this.name,
      source: this.source,
      type: this.type,
      label: this.label,
      created: this.created,
      changed: this.changed,
      size: this.size,
    };
  }

  /**
   * Reads the content from disc and resolves it.
   *
   * @param encoding
   * @param stats Whether to read the file stats too.
   * @return The file content.
   */
  async read(encoding = 'utf8', stats = false): Promise<string | Buffer> {
    if (this.data) {
      if (stats && this.size) return this.data;
      else if (!stats) return this.data;
    }
    const re: string | Buffer = await require('fs-extra').readFile(this.uri, encoding);
    this.data = re;
    if (!stats) return re;
    const sts: Stats = await require('fs-extra').stat(this.uri);
    this.created = sts.birthtimeMs;
    this.changed = sts.mtime.getTime();
    this.size = sts.size;
    return re;
  }

  /**
   * Writes the given data to disc and resolves if successful.
   * @param data
   */
  async write(data: any): Promise<void> {
    const re = await require('fs-extra').writeFile(this.uri, data);
    this.data = data;
    return re;
  }

}
