/**
 * An exception is an extendable error.
 * Using an exception we can throw custom errors,
 * which may contain more useful information than just a trace and a message.
 *
 * @export
 * @class Exception
 * @extends {Error}
 */
export class Exception extends Error {

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }

}
