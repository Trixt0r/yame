import { EventEmitter as eventemitter3 } from 'eventemitter3';
import { EventEmitter } from './event-emitter';

describe('EventEmitter', () => {

  let spy;

  beforeEach(() => {
    spy = { fn: function() {} };
    spyOn(spy, 'fn');
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

});
