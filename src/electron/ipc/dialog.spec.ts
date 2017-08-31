import { IpcDialog } from './dialog';

describe('Dialog ipc actions', function() {

  let action = new IpcDialog();

  it('Should initialize the ipc main handler for opening a file dialog', function() {
    action.init(this.app.electron.remote);
    expect(action.isInitialized).toBe(true);
  });

});
