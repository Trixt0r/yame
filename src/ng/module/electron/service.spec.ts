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
      .not.toThrow('Provider with name MyProvider has been already registered');
  });

  it('should be able to register MyProvider twice', () => {
    expect(() => {
      service.registerProvider(MyProvider);
      service.registerProvider(MyProvider);
    })
    .toThrow('Provider with name MyProvider has been already registered');
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

  it('should have an instance for MyProvider2', () => {
    expect(service.getProvider(MyProvider2)).toBeUndefined('MyProvider2 is defined');
  });

});
