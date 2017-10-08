import { ElectronService } from './service';


export abstract class ElectronProvider {
  constructor(protected service: ElectronService) {
  }
}
