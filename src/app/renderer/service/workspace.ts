import { Subject } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import * as _ from 'lodash';
import * as Promise from 'bluebird';

/**
 * The workspace service is holding a json representation of the workspace files.
 *
 * @export
 * @class WorkspaceService
 * @todo Implement watch task on the directory
 */
@Injectable()
export class WorkspaceService {

  private internalFiles;
  private internalState: string = 'init';
  private internalError;

  private initSource = new Subject<void>();
  private readySource = new Subject<void>();
  private failSource = new Subject<void>();

  init$ = this.initSource.asObservable();
  ready$ = this.readySource.asObservable();
  fail$ = this.failSource.asObservable();

  /**
   * Initializes the given directory as the workspace directory.
   * The loaded json representation gets resolved on success.
   *
   * @param {string} rootDir The full path of the workspace.
   * @returns {Promise}
   */
  init(rootDir: string) {
    if (this.internalState !== 'init')
      return Promise.resolve(this.internalFiles);
    this.internalState = 'init';
    this.initSource.next();
    return new Promise((resolve, reject) => {
      let id = _.uniqueId('asset-service-');
      ipcRenderer.send('directory:scan', rootDir, id, true);
      ipcRenderer.once(`directory:scan:${id}:done`, (event, json) => {
        ipcRenderer.removeAllListeners(`directory:scan:${id}:fail`);
        this.internalFiles = json;
        this.internalState = 'ready';
        this.readySource.next();
        resolve(this.internalFiles);
      });
      ipcRenderer.once(`directory:scan:${id}:fail`, (event, e) => {
        ipcRenderer.removeAllListeners(`directory:scan:${id}:done`);
        this.internalState = 'fail';
        this.internalError = e;
        this.failSource.next();
        reject(e);
      });
    });
  }

  get state(): string {
    return this.internalState;
  }

  get files() {
    return this.internalFiles;
  }

  get error() {
    return this.internalError;
  }
}