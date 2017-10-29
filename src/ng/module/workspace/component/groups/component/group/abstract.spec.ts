import { EventEmitter } from '@angular/core';
import { GroupComponent } from './abstract';

class MyGroupComponent extends GroupComponent { }

describe('GroupComponent', () => {

  let comp: GroupComponent;

  beforeEach(() => {
    comp = new MyGroupComponent();
  })

  it('should have a click event emitter', () => {
    expect(comp.clickEvent instanceof EventEmitter).toBe(true, 'No click event emitter defined');
  });

  it('should emit the click event in click()', () => {
    let called = false;
    comp.clickEvent.subscribe(() => called = true);
    comp.click(new MouseEvent('click'));
    expect(called).toBe(true, 'The click event has not been emitted');
  });

});
