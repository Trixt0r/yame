import { IpcAction } from './ipc/abstract';
import { IpcDirectory } from './ipc/directory';
import { IpcDialog } from './ipc/dialog';
import PubSub from '../common/pubsub';
import * as Promise from 'bluebird';

/**
 * Sets all possible ipc messages up.
 *
 * @export
 * @todo Plugins should be able to add their ipc setup.
 */
export default function(electron: Electron.AllElectron): Promise<any> {

  let ipcActions: IpcAction[] = [
    new IpcDialog(),
    new IpcDirectory(),
  ];

  PubSub.emit('ipc:init', ipcActions);

  let proms = [];

  ipcActions.forEach( action => proms.push(action.init(electron)) );

  return Promise.all(proms);
}
