import { Application } from 'spectron';
import * as path from 'path';

let electronPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron');
if (process.platform === 'win32') electronPath += '.cmd';

beforeAll(function () {
  this.app= new Application({ path: electronPath });
  return this.app.start();
});

afterAll(function () {
  if (this.app && this.app.isRunning()) {
    return this.app.stop()
  }
});
