import { ElectronProvider } from './electron.provider';
import { ElectronMockService } from './electron.mock.service';

class MyProvider extends ElectronProvider {

}

describe('ElectronProvider', () => {

  it('should be extendable', () => expect(new MyProvider(new ElectronMockService()) instanceof ElectronProvider).toBe(true));

});
