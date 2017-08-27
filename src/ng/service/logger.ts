import { ILogger } from '../../common/logger';
import logger from '../../common/logger';
import { Injectable } from '@angular/core';

@Injectable()
// TODO: Implement a logger which sends an ipc message and lets the main process work
export class LoggerService {

  private logger = logger;

  get target(): ILogger {
    return this.logger.target;
  }

  set target(target: ILogger) {
    this.logger.target = target;
  }

  log(... args: any[]) {
    this.logger.log.apply(this.logger, args);
  }

  info(... args: any[]) {
    this.logger.info.apply(this.logger, args);
  }

  warn(... args: any[]) {
    this.logger.warn.apply(this.logger, args);
  }

  error(... args: any[]) {
    this.logger.error.apply(this.logger, args);
  }

  debug(... args: any[]) {
    this.logger.debug.apply(this.logger, args);
  }
}