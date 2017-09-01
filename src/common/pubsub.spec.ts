import { EventEmitter } from './event-emitter';
import { Pubsub } from './pubsub';

describe('Public subscriptions', () => {

  let spy;

  beforeEach(() => {
    spy = { fn: function() { } };
    spyOn(spy, 'fn');
    Pubsub.on('my-event', spy.fn);
  })

  it('should be an instance of EventEmitter', () => expect(Pubsub instanceof EventEmitter).toBe(true));

  it('should call fn when triggering the public event "my-event"', () => {
    Pubsub.emit('my-event');
    expect(spy.fn).toHaveBeenCalled();
  });

});
