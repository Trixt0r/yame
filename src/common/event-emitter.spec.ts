import { EventEmitter as eventemitter3 } from 'eventemitter3';
import { EventEmitter } from './event-emitter';

class MyEmitter extends EventEmitter {
  publicChange(property: string, currentValue: any, newValue: any, fn?: Function): boolean {
    return this.change(property, currentValue, newValue, fn);
  }
}

describe('EventEmitter', () => {

  let spy, changeSpy;

  beforeEach(() => {
    spy = { fn: function() {} };
    changeSpy = { fn: function() {} };
    spyOn(spy, 'fn');
    spyOn(changeSpy, 'fn');
  });

  it('should extend eventemitter3', () => expect(new EventEmitter() instanceof eventemitter3).toBe(true));

  it('should re-trigger "my-event" from another event emitter', () => {
    let toObserve = new EventEmitter();
    let delegator = new EventEmitter();
    delegator.delegateOn('my-event', toObserve);
    delegator.on('my-event', spy.fn);
    toObserve.emit('my-event', true);
    expect(spy.fn).toHaveBeenCalled();
  });

  it('should re-trigger "my-event" as a "my-new-event"', () => {
    let toObserve = new EventEmitter();
    let delegator = new EventEmitter();
    delegator.delegateOn('my-event', toObserve, 'my-new-event');
    delegator.on('my-new-event', spy.fn);
    toObserve.emit('my-event', true);
    expect(spy.fn).toHaveBeenCalled();
  });

  it('should trigger on change', () => {
    let toObserve = new MyEmitter();
    toObserve.on('change:myProp', changeSpy.fn);
    toObserve.publicChange('myProp', true, false);
    expect(changeSpy.fn).toHaveBeenCalled();
  });

  it('should call the callback on change', () => {
    let toObserve = new MyEmitter();
    toObserve.publicChange('myProp', true, false, changeSpy.fn);
    expect(changeSpy.fn).toHaveBeenCalled();
  });

  it('should not trigger on change', () => {
    let toObserve = new MyEmitter();
    toObserve.on('change:myProp', changeSpy.fn);
    toObserve.publicChange('myProp', true, true);
    expect(changeSpy.fn).not.toHaveBeenCalled();
  });

});
