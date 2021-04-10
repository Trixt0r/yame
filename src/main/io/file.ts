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
   * The file stats.
   */
  stats?: Stats;

  /**
   * The creation timestamp.
   */
  get created(): number | undefined {
    return this.stats?.birthtimeMs;
  }

  /**
   * The last modification timestamp.
   */
  get changed(): number | undefined {
    return this.stats?.mtime.getTime();
  }

  /**
   * The size of the file, in bytes.
   */
  get size(): number | undefined {
    return this.stats?.size;
  }

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
   * Reads the stats for this file.
   *
   * @param force Whether to force a stats read.
   * @return The file stats.
   */
  async getStats(force = false): Promise<Stats | void> {
    if (this.stats && !force) return this.stats;
    this.stats = await require('fs-extra').stat(this.uri);
    return this.stats;
  }

  /**
   * Reads the content from the file and resolves it.
   *
   * @param encoding
   * @param stats Whether to read the file stats too.
   * @return The file content.
   */
  async read(encoding: string = 'utf8', stats = false): Promise<string | Buffer> {
    if (this.data) {
      if (stats && this.size) return this.data;
      else if (!stats) return this.data;
    }
    const re: string | Buffer = await require('fs-extra').readFile(this.uri, encoding);
    this.data = re;
    if (!stats) return re;
    await this.getStats();
    return re;
  }

  /**
   * Writes the given data to disc and resolves if successful.
   *
   * @param data The file content to write.
   * @param encoding Optional encoding
   */
  async write(data: any, encoding: string = 'utf8'): Promise<void> {
    const re = await require('fs-extra').writeFile(this.uri, data, encoding);
    this.data = data;
    return re;
  }

}
