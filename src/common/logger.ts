import { Logger as ILogger } from './interfaces/logger';

/**
 * Wrapper for logging to a specific target.
 * The default target is the console.
 * @class Logger
 * @implements {ILogger}
 */
export class Logger implements ILogger {

  /**
   * The logging target.
   * Defaults to `console`.
   *
   * @protected
   * @type {ILogger}
   */
  protected loggingTarget: ILogger = console;

  /**
   * The logging target target.
   * @type {ILogger}
   */
  get target(): ILogger {
    return this.loggingTarget;
  }

  /**
   * Sets the logger.
   * @memberof Logger
   * @throws {Exception} If the set target does not implement the logger interface.
   */
  set target(target: ILogger) {
    // We can not use instanceof in TS -.-
    if (!target || !target.debug || !target.error || !target.info || !target.warn || !target.log)
      throw 'The set target has to implement the logger interface!';
    this.loggingTarget = target;
  }

  /** @inheritdoc */
  log(... args: any[]) {
    this.loggingTarget.log.apply(this.loggingTarget, args);
  }

  /** @inheritdoc */
  info(... args: any[]) {
    this.loggingTarget.info.apply(this.loggingTarget, args);
  }

  /** @inheritdoc */
  warn(... args: any[]) {
    this.loggingTarget.warn.apply(this.loggingTarget, args);
  }

  /** @inheritdoc */
  error(... args: any[]) {
    this.loggingTarget.error.apply(this.loggingTarget, args);
  }

  /** @inheritdoc */
  debug(... args: any[]) {
    this.loggingTarget.debug.apply(this.loggingTarget, args);
  }

}

/** @type {Logger} The default logger instance. */
export let logger: Logger = new Logger();

export default logger;
