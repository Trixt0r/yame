import { IpcAction } from './ipc/abstract';
import ipc from './ipc';
import PubSub from '../common/pubsub';

describe('Ipc action loader', function() {

  it('should load ipc handlers and resolve', function() {
    return ipc()
      .then(() => expect(true).toBe(true))
      .catch(() => expect(false).toBe(true));
  });

  it('should trigger the ipc:init public event', function() {
    PubSub.on('ipc:init', () => {
      expect(true).toBe(true);
    });
    return ipc();
  });

  it('should trigger the ipc:init public event', function() {

    class CustomIpcAction extends IpcAction {
      init(): Promise<any> {
        return new Promise((resolve) => {
          this._initialized = true;
          resolve();
        });
      }
    }

    let action = new CustomIpcAction();
    PubSub.on('ipc:init', (list: IpcAction[]) => list.push(action));
    return ipc()
      .then(() => expect(action.isInitialized).toBe(true));
  });
});
