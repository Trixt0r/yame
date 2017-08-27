/**
 * An interface which has to implemented by anyone who wants to log data.
 *
 * @export
 * @interface ILogger
 */
export interface ILogger {

  log(... args: any[]): void;

  info(... args: any[]): void;

  warn(... args: any[]): void;

  error(... args: any[]): void;

  debug(... args: any[]): void;
}

/**
 * Wrapper for logging to a specific target.
 * @class Logger
 * @implements {ILogger}
 */
class Logger implements ILogger {

  private loggingTarget: ILogger = console;

  get target(): ILogger {
    return this.loggingTarget;
  }

  set target(target: ILogger) {
    this.loggingTarget = target;
  }

  log(... args: any[]) {
    this.loggingTarget.log.apply(this.loggingTarget, args);
  }

  info(... args: any[]) {
    this.loggingTarget.info.apply(this.loggingTarget, args);
  }

  warn(... args: any[]) {
    this.loggingTarget.warn.apply(this.loggingTarget, args);
  }

  error(... args: any[]) {
    this.loggingTarget.error.apply(this.loggingTarget, args);
  }

  debug(... args: any[]) {
    this.loggingTarget.debug.apply(this.loggingTarget, args);
  }
}

let logger = new Logger();

export default logger;