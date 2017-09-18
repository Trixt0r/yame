import { Logger, logger as defaultLogger } from './logger';

describe('Logger', () => {

  let logParams = {
    log: [1, 2, 3, 4],
    info: ['1', '2', '3', '4'],
    warn: ['one', 'two', 'three', 'four'],
    error: [9, 8, 7, 6],
    debug: ['9', '8', '7', '6'],
  };

  let console = {
    log: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
  };

  beforeAll(() => {
    for (var fn in console)
      spyOn(console, <any>fn);
  });

  let logger = new Logger();

  it('should have a default target', () => expect(logger.target).toBeDefined());

  it('should have console as the default target', () => expect(logger.target).toBe(global.console));

  it('should throw an exception if the new target is not a logger', () => {
    expect(() => logger.target = <any>{ }).toThrow();
    expect(logger.target).toBeDefined();
  });

  it('should throw an exception if the new target is null', () => {
    expect(() => logger.target = <any>null).toThrow();
    expect(logger.target).toBeDefined();
  });

  it('should change the target', () => {
    let prev = logger.target;
    logger.target = console;
    expect(logger.target).toBeDefined();
    expect(logger.target).not.toEqual(prev);
    expect(logger.target).toEqual(console);
  });

  it('should call the log method on the target', () => {
    logger.log(logParams.log);
    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(logParams.log);
  });

  it('should call the info method on the target', () => {
    logger.info(logParams.info);
    expect(console.info).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(logParams.info);
  });

  it('should call the warn method on the target', () => {
    logger.warn(logParams.warn);
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(logParams.warn);
  });

  it('should call the error method on the target', () => {
    logger.error(logParams.error);
    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(logParams.error);
  });

  it('should call the debug method on the target', () => {
    logger.debug(logParams.debug);
    expect(console.debug).toHaveBeenCalled();
    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith(logParams.debug);
  });

});

describe('Default logger', () => {
  it('should implement the logger interface', () => {
    expect(typeof defaultLogger.log).toBe('function');
    expect(typeof defaultLogger.info).toBe('function');
    expect(typeof defaultLogger.debug).toBe('function');
    expect(typeof defaultLogger.error).toBe('function');
    expect(typeof defaultLogger.warn).toBe('function');
  });
})
