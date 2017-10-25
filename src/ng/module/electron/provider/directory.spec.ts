import { DirectoryProviderException } from '../exception/provider/directory';
import { DirectoryProvider } from './directory';
import { MockedService } from './mocked-service';

describe('DirectoryProvider', () => {

  let service: MockedService;
  let provider: DirectoryProvider;
  let sendSpy: jasmine.Spy;

  beforeEach(() => {
    service = new MockedService();
    provider = new DirectoryProvider(service);
    sendSpy = spyOn(service.ipc, 'send');
  });

  describe('scan', () => {
    it('should return a promise', () => {
      expect(provider.scan('myDir') instanceof Promise).toBe(true, 'No promise returned');
    });

    it('should send "directory:scan" event', () => {
      provider.scan('myDir');
      expect(sendSpy.calls.any()).toBe(true, 'An event has not been sent');
      expect(sendSpy.calls.mostRecent().args.length).toBe(4, 'The correct amount of args has not been passed');
      expect(sendSpy.calls.mostRecent().args[0]).toBe('directory:scan', '"directory:scan" has not been sent');
    });

    it('should register a "directory:scan:id:done" handler', () => {
      let onceSpy = spyOn(service.ipc, 'once');
      provider.scan('myDir');
      let id = sendSpy.calls.mostRecent().args[2];
      expect(onceSpy.calls.any()).toBe(true, 'An event handler has not been registered');
      expect(onceSpy.calls.first().args.length).toBe(2, 'The correct amount of args has not been passed');
      expect(onceSpy.calls.first().args[0]).toBe(`directory:scan:${id}:done`,
                                            `An event handler for "directory:scan:${id}:done" has not been registered`);
    });

    it('should register a "directory:scan:${id}:fail" handler', () => {
      let onceSpy = spyOn(service.ipc, 'once');
      provider.scan('myDir');
      let id = sendSpy.calls.mostRecent().args[2];
      expect(onceSpy.calls.any()).toBe(true, 'An event handler has not been registered');
      expect(onceSpy.calls.mostRecent().args.length).toBe(2, 'The correct amount of args has not been passed');
      expect(onceSpy.calls.mostRecent().args[0]).toBe(`directory:scan:${id}:fail`,
                                            `An event handler for "directory:scan:${id}:fail" has not been registered`);
    });

    it('should resolve the scanned json on "directory:scan:id:done"', done => {
      let promise = provider.scan('myDir');
      let id = sendSpy.calls.mostRecent().args[2];
      setTimeout(() => service.ipc.emit(`directory:scan:${id}:done`, {}, { }));
      promise
        .then(json => expect(json).toBeDefined('No json resolved'))
        .then(done);
    }, 10);

    it('should reject if "directory:scan:id:fail" go emitted', done => {
      let promise = provider.scan('myDir');
      let id = sendSpy.calls.mostRecent().args[2];
      setTimeout(() => service.ipc.emit(`directory:scan:${id}:fail`, {}, new Error('Some scan error')));
      promise.then(files => { throw 'No exception'; })
              .catch(e => {
                expect(e instanceof DirectoryProviderException).toBe(true,
                                                            'No DirectoryProviderException exception rejected');
                expect(e.message).toBeDefined('No message defined');
                expect(e.message).toEqual('Some scan error', 'Incorrect message reject');
                done();
              });
    }, 10);
  })

});
