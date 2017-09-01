import { Logger } from '../../common/logger';
import { Injectable } from '@angular/core';

@Injectable()
// TODO: Implement a logger which sends an ipc message and lets the main process work
export class LoggerService extends Logger { }
