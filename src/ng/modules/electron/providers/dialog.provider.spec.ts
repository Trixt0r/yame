import { ElectronService } from '../electron.service';
import { ElectronMockService } from '../electron.mock.service';
import { DialogProviderException } from '../exception/providers/dialog.exception';
import { DialogProvider } from './dialog.provider';

describe('DialogProvider', () => {

  let service: ElectronService;
  let provider: DialogProvider;
  let sendSpy: jasmine.Spy;

  beforeEach(() => {
    service = new ElectronMockService();
    provider = new DialogProvider(service);
    sendSpy = spyOn(service.ipc, 'send');
  });

  describe('open', () => {
    it('should return a promise', () => {
      expect(provider.open({ }) instanceof Promise).toBe(true, 'No promise returned');
    });

    it('should send "dialog:open" event', () => {
      provider.open({ });
      expect(sendSpy.calls.any()).toBe(true, 'An event has not been sent');
      expect(sendSpy.calls.mostRecent().args.length).toBe(3, 'The correct amount of args has not been passed');
      expect(sendSpy.calls.mostRecent().args[0]).toBe('dialog:open', '"dialog:open" has not been sent');
    });

    it('should register a "dialog:open:id" handler', () => {
      let onceSpy = spyOn(service.ipc, 'once');
      provider.open({ });
      let id = sendSpy.calls.mostRecent().args[2];
      expect(onceSpy.calls.any()).toBe(true, 'An event handler has not been registered');
      expect(onceSpy.calls.mostRecent().args.length).toBe(2, 'The correct amount of args has not been passed');
      expect(onceSpy.calls.mostRecent().args[0]).toBe(`dialog:open:${id}`,
                                                    `An event handler for "dialog:open:${id}" has not been registered`);
    });

    it('should resolve the files on "dialog:open:id"', done => {
      let promise = provider.open({ });
      let id = sendSpy.calls.mostRecent().args[2];
      setTimeout(() => service.ipc.emit(`dialog:open:${id}`, {}, ['file1', 'dir1']));
      promise
        .then(files => {
          expect(files).toBeDefined('No files defined');
          expect(files.length).toBe(2, 'Not the correct amount of files has been resolved');
          done();
        });
    });

    it('should reject if the files are empty on "dialog:open:id"', done => {
      let promise = provider.open({ });
      let id = sendSpy.calls.mostRecent().args[2];
      setTimeout(() => service.ipc.emit(`dialog:open:${id}`, {}, []));
      promise.then(files => { throw 'No exception'; })
        .catch(e => {
          expect(e instanceof DialogProviderException).toBe(true,
                                        'No DirectoryProviderException exception rejected');
          expect(e.message).toBeDefined('No message defined');
          expect(e.message).toEqual('No files chosen', 'Incorrect message rejected');
          done();
        });
    });

    it('should reject if the files are not set on "dialog:open:id"', done => {
      let promise = provider.open({ });
      let id = sendSpy.calls.mostRecent().args[2];
      setTimeout(() => service.ipc.emit(`dialog:open:${id}`, {}));
      promise.then(files => { throw 'No exception'; })
        .catch(e => {
          expect(e instanceof DialogProviderException).toBe(true,
                                        'No DirectoryProviderException exception rejected');
          expect(e.message).toBeDefined('No message defined');
          expect(e.message).toEqual('No files chosen', 'Incorrect message rejected');
          done();
        });
    });
  })

});
