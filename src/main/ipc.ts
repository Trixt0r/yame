import { IpcAction } from './ipc/abstract';
import { IpcDirectory } from './ipc/directory';
import { IpcDialog } from './ipc/dialog';
import PubSub from '../common/pubsub';
import { IpcPlugins } from './ipc/plugins';
import { IpcFile } from './ipc/file';

/**
 * Sets all possible ipc messages up.
 *
 * @export
 * @todo Plugins should be able to add their ipc setup.
 */
export default async function() {

  let ipcActions: IpcAction[] = [
    new IpcDialog(),
    new IpcDirectory(),
    new IpcFile(),
    new IpcPlugins(),
  ];

  PubSub.emit('ipc:init', ipcActions);
  await Promise.all(ipcActions.map(action => action.init()));
}
