import { IpcAction } from './abstract';

class CustomIpcAction extends IpcAction {

  /** @inheritdoc */
  init(): Promise<any> {
    return new Promise((resolve) => {
      this._initialized = true;
      resolve();
    });
  }
}

describe('Abstract ipc action', function() {

  it('should be initialized after calling init()', function() {
    let action = new CustomIpcAction();
    return action.init().then(() => expect(action.isInitialized).toBe(true));
  });

  it('should not be initialized after not calling init()', function() {
    let action = new CustomIpcAction();
    expect(action.isInitialized).toBe(false);
  });
})
