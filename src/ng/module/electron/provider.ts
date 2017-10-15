import { ElectronService } from './service';


export abstract class ElectronProvider {
  constructor(protected service: ElectronService) {
  }

  /**
   * @readonly
   * @type {Electron.IpcRenderer}
   */
  get ipc() {
    return this.service.ipc;
  }
}
