import { ElectronService } from './electron.service';
import { EventEmitter } from 'eventemitter3';

class MockedIpc extends EventEmitter {

  send(channel: string, ...args: any[]) { };
  sendSync(channel: string, ...args: any[]) { };
  sendToHost(channel: string, ...args: any[]) { };
}

/**
 * Helper class for mocking the electron service.
 * This class mocks only electron dependencies, such as the ipcRenderer instance.
 */
export class ElectronMockService extends ElectronService {

  private myIpc = new MockedIpc();

  get ipc() {
    return <any>this.myIpc;
  }
}
