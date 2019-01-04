import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, SimpleChange } from '@angular/core';
import { ResizeableComponent } from './resizable';

class EventHandler {
  fn() {}
}

describe('ResizeableComponent', () => {
  let comp: ResizeableComponent;
  let fixture: ComponentFixture<ResizeableComponent>;
  let updateSpy: jasmine.Spy;

  beforeEach(done => {
    TestBed.configureTestingModule({
      declarations: [ResizeableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizeableComponent);
    comp = fixture.componentInstance;
    comp.ref = fixture.elementRef;
    comp.maxVal = 500;
    comp.minVal = 10;
    comp.property = 'left';

    const handler = new EventHandler();
    updateSpy = spyOn(handler, 'fn');
    comp.sizeUpdated.subscribe(handler.fn);

    fixture.detectChanges();

    setTimeout(done);
  });

  describe('ngAfterViewInit', () => {
    it('should update after init', () => {
      expect(updateSpy.calls.any()).toBe(true, 'Has not been update after init');
    });

    it('should clamp the value after init', () => {
      expect(updateSpy.calls.mostRecent().args[0]).toBe(10, 'Has not been clamped');
    });
  });

  describe('updateValue', () => {
    it('should emit the size updated event', () => {
      updateSpy.calls.reset();
      comp.updateValue(20);
      expect(updateSpy.calls.any()).toBe(true, 'sizeUpdate not emitted');
    });

    it('should emit the size updated event with the set value', () => {
      comp.updateValue(20);
      expect(updateSpy.calls.mostRecent().args[0]).toBe(20, 'The correct value has not been emitted');
    });

    it('should apply the update value to the style as pixels', () => {
      comp.updateValue(20);
      expect(comp.ref.nativeElement.style.left).toBe(`20px`, 'The style has not been applied');
    });
  });

  describe('clampValue', () => {
    it('should clamp the value between min and max', () => {
      const tooSmall = comp.clampValue(-500);
      const tooBig = comp.clampValue(1000);
      expect(tooSmall).toBe(comp.minVal, 'The value has not been clamped no min');
      expect(tooBig).toBe(comp.maxVal, 'The value has not been clamped no max');
    });

    it('should clamp NaN to min', () => {
      const clamped = comp.clampValue(NaN);
      expect(clamped).toBe(comp.minVal, 'NaN has not been clamped');
    });
  });

  describe('external events', () => {
    it('should update on resize', () => {
      updateSpy.calls.reset();
      comp.onResize();
      expect(updateSpy.calls.any()).toBe(true, 'Not updated on resize');
    });

    it('should not update on mouse move if mouse was not pressed', () => {
      updateSpy.calls.reset();
      comp.onMouseMove(new MouseEvent('mousemove'));
      expect(updateSpy.calls.any()).toBe(false, 'Updated while mouse was not pressed');
    });

    it('should update on mouse move if mouse was pressed', () => {
      updateSpy.calls.reset();
      const mousedown = new MouseEvent('mousedown');
      const mousemove = new MouseEvent('mousemove');
      mousedown.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      mousemove.initMouseEvent('mousemove', true, true, window, 0, 0, 0, 10, 10, false, false, false, false, 0, null);
      comp.onMouseDown(mousedown);
      comp.onMouseMove(mousemove);
      expect(updateSpy.calls.any()).toBe(true, 'Did not update while mouse was moving');
    });

    it('should not update on mouse move if mouse was not moved', () => {
      updateSpy.calls.reset();
      const mousedown = new MouseEvent('mousedown');
      const mousemove = new MouseEvent('mousemove');
      mousedown.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 10, 0, false, false, false, false, 0, null);
      mousemove.initMouseEvent('mousemove', true, true, window, 0, 0, 0, 10, 0, false, false, false, false, 0, null);
      comp.onMouseDown(mousedown);
      comp.onMouseMove(mousemove);
      expect(updateSpy.calls.any()).toBe(false, 'Did update while mouse was not moving');
    });

    it('should increase the value by the moved value', () => {
      updateSpy.calls.reset();
      const valBefore = comp.propertyValue;
      const mousedown = new MouseEvent('mousedown');
      const mousemove = new MouseEvent('mousemove');
      mousedown.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      mousemove.initMouseEvent('mousemove', true, true, window, 0, 0, 0, 100, 0, false, false, false, false, 0, null);
      comp.onMouseDown(mousedown);
      comp.onMouseMove(mousemove);
      expect(comp.propertyValue).toBe(valBefore + 100, 'Did not increase the value by 100');
    });

    it('should increase vertical aligned properties by clientY', () => {
      updateSpy.calls.reset();
      comp.property = 'top';
      comp.ngOnChanges({
        property: new SimpleChange('left', 'top', true),
      });
      fixture.detectChanges();
      const valBefore = comp.propertyValue;
      const mousedown = new MouseEvent('mousedown');
      const mousemove = new MouseEvent('mousemove');
      mousedown.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      mousemove.initMouseEvent('mousemove', true, true, window, 0, 0, 0, 0, 100, false, false, false, false, 0, null);
      comp.onMouseDown(mousedown);
      comp.onMouseMove(mousemove);
      expect(comp.propertyValue).toBe(valBefore + 100, 'Did not increase the value vertically by 100');
    });

    it('should not update on mouse move if mouse was released after pressing', () => {
      updateSpy.calls.reset();
      comp.onMouseDown(new MouseEvent('mousedown'));
      comp.onMouseUp();
      comp.onMouseMove(new MouseEvent('mousemove'));
      expect(updateSpy.calls.any()).toBe(false, 'Updated after mouse was moved but released');
    });
  });
});
