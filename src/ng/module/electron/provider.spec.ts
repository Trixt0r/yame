import { ElectronProvider } from './provider';

class MyProvider extends ElectronProvider {

}

describe('ElectronProvider', () => {

  it('should be extendable', () => expect(new MyProvider(null) instanceof ElectronProvider).toBe(true));

});
