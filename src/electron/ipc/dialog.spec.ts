import { IpcDirectory } from './directory';
describe('Dialog actions', function() {

  let action = new IpcDirectory();

  it('Should initialize the scan', function() {
    action.init();
    expect(action.isInitialized).toBe(true);
  });


});
