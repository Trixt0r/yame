import { IpcDirectory } from './directory';

describe('Directory ipc actions', function() {

  let action = new IpcDirectory();

  it('Should initialize the ipc main handler for scanning a directory', function() {
    action.init(this.app.electron.remote);
    expect(action.isInitialized).toBe(true);
  });

});
