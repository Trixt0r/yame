import { ElectronProviderNotFound } from './exception/service/not-found';
import { ElectronProviderAlreadyRegistered } from './exception/service/registered';
import { ElectronProvider } from './provider';
import { ElectronService } from './service';

class MyProvider extends ElectronProvider {

}

class MyProvider2 extends ElectronProvider {

}

describe('ElectronService', () => {

  let service: ElectronService;

  beforeEach(() => {
    service = new ElectronService();
  });

  it('should register MyProvider', () => {
    expect(() => service.registerProvider(MyProvider))
      .not.toThrowError('Provider with name MyProvider has been already registered');
  });

  it('should be able to register MyProvider twice', () => {
    let thrown = false;
    try {
      service.registerProvider(MyProvider);
      service.registerProvider(MyProvider);
    } catch (e) {
      expect(e instanceof ElectronProviderAlreadyRegistered ).toBe(true);
      expect(e.message).toEqual('Provider with name MyProvider has been already registered');
      thrown = true;
    }
    expect(thrown).toBe(true, 'ElectronProviderAlreadyRegistered has not been thrown');
  });

  it('should have an instance for MyProvider', () => {
    service.registerProvider(MyProvider);
    expect(service.getProvider(MyProvider)).toBeDefined('MyProvider is not defined');
  });

  it('should return always the same instance for MyProvider', () => {
    service.registerProvider(MyProvider);
    let inst1 = service.getProvider(MyProvider);
    let inst2 = service.getProvider(MyProvider);
    expect(inst2).toBe(inst1, 'The provider instances are not the same');
  });

  it('should not have an instance for MyProvider2', () => {
    let thrown = false;
    try {
      service.getProvider(MyProvider2);
    } catch (e) {
      expect(e instanceof ElectronProviderNotFound ).toBe(true);
      expect(e.message).toEqual('No electron provider found for MyProvider2');
      thrown = true;
    }
    expect(thrown).toBe(true, 'ElectronProviderNotFound has not been thrown');
  });

});
