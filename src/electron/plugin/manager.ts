import * as glob from 'glob';
import * as path from 'path';
import { Environment, YameElectronEnvironment } from '../environment';
import * as _ from 'lodash';
import { Plugin } from '../../common/interface/plugin';
import { CommonPluginManager } from '../../common/plugin-manager';

/**
 * Plugin manager for the electron side of the editor.
 *
 * @class PluginManager
 * @extends CommonPluginManager
 */
export class PluginManager extends CommonPluginManager {

  protected environment: YameElectronEnvironment = Environment;
  protected static files: string[];

  protected type = 'electron';

  getFiles(): Promise<string[]> {
    return PluginManager.getFiles();
  }

  /** @inheritdoc */
  require(path: string) {
    return require(path);
  }

  /**
   * Reads all plugin files from the config and resolves them.
   *
   * @static
   * @returns {Promise<string[]>}
   */
  static getFiles(force = false): Promise<string[]> {
    if (PluginManager.files && !force)
      return Promise.resolve(PluginManager.files);
    let globs = Environment.config.plugins;
    if (!Array.isArray(globs))
      globs = [globs];
    const proms = [];
    globs.forEach(pattern => {
      proms.push(new Promise((resolve, reject) => {
        glob(pattern, (err, files) => {
          if (err) return reject(err);
          resolve(files);
        });
      }));
    });
    return Promise.all(proms)
            .then(re => _.flatten(re, true).map(uri => path.resolve(uri)) )
            .then(re => PluginManager.files = re);
  }

}
