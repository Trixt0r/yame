import * as glob from 'glob';
import * as path from 'path';
import { Environment, IYameElectronEnvironment } from '../environment';
import * as _ from 'lodash';
import { CommonPluginManager } from '../../common/plugin.manager';
import { File } from '../io/file';
import { YamePlugin } from '../../common/plugin';

/**
 * Plugin manager for the electron side of the editor.
 *
 * @class PluginManager
 * @extends CommonPluginManager
 */
export class PluginManager extends CommonPluginManager {
  /** @inheritdoc */
  protected environment: IYameElectronEnvironment = Environment;

  /**
   * Files read from the config.
   */
  protected static files: string[];

  /**
   * Require electron type entry points.
   *
   * @inheritdoc
   */
  protected type = 'electron';

  /**
   * @inheritdoc
   */
  getFiles(): Promise<string[]> {
    return PluginManager.getFiles();
  }

  /**
   * @inheritdoc
   */
  require(path: string) {
    return require(path);
  }

  /**
   * Persists the config for the given plugin.
   *
   * @todo Write to local user storage and not to the package.json.
   */
  protected persistConfig(plugin: YamePlugin): Promise<unknown> {
    const file = new File(path.resolve(this.pluginPaths[plugin.id], 'package.json'));
    return file.write(JSON.stringify(plugin.config, null, 2));
  }

  /**
   * Reads all plugin files from the config and resolves them.
   */
  static getFiles(force = false): Promise<string[]> {
    if (PluginManager.files && !force) return Promise.resolve(PluginManager.files);
    let globs = (Environment.config || {}).plugins;
    if (!globs) return Promise.resolve([]);
    if (!Array.isArray(globs)) globs = [globs];
    const proms: Promise<string[]>[] = [];
    globs.forEach(pattern => {
      proms.push(
        new Promise((resolve, reject) => {
          glob(pattern, (err, files) => {
            if (err) return reject(err);
            resolve(files);
          });
        })
      );
    });
    return Promise.all(proms)
      .then(re => _.flatten(re).map(uri => path.resolve(uri)))
      .then(re => (PluginManager.files = re));
  }
}
