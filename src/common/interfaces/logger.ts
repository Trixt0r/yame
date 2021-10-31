/**
 * An interface which has to implemented by anyone who wants to log data.
 *
 * @export
 * @interface Logger
 */
export interface Logger {

  /** @returns {void} Logs the given argumens to the default log level. */
  log(... args: any[]): void;

  /** @returns {void} Logs the given argumens as an information. */
  info(... args: any[]): void;

  /** @returns {void} Logs the given argumens as a warning. */
  warn(... args: any[]): void;

  /** @returns {void} Logs the given argumens as an error. */
  error(... args: any[]): void;

  /** @returns {void} Logs the given argumens as a debug log. */
  debug(... args: any[]): void;

}
