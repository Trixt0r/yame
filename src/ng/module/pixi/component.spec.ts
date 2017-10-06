import { PixiService } from './service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement, Injectable } from '@angular/core';
import { PixiComponent } from './component';

@Injectable()
class FakePixiService {
  public static RESIZEVAL = null;
  setUp(ref, options) { /* NOOP */ }
  resize() { return FakePixiService.RESIZEVAL; }
}

describe('PixiComponent', () => {

    let comp: PixiComponent;
    let fixture: ComponentFixture<PixiComponent>;
    let initSpy: jasmine.Spy;
    let resizeSpy: jasmine.Spy;

    beforeEach(() => {

      TestBed.configureTestingModule({
        declarations: [ PixiComponent ],
        providers: [ { provide: PixiService, useClass: FakePixiService } ],
      }).compileComponents();

      fixture = TestBed.createComponent(PixiComponent);
      const pixiService = fixture.debugElement.injector.get(PixiService);

      comp = fixture.componentInstance;
      initSpy = spyOn(pixiService, 'setUp');

      let resizeHandler = { fn: () => {} };
      resizeSpy = spyOn(resizeHandler, 'fn');
      comp.resized.subscribe(resizeHandler.fn);
    });

    it('should have a canvas', () => {
      let de = fixture.debugElement.query(By.css('canvas'));
      expect(de.nativeElement).toBeDefined('No canvas element defined');
      expect(comp.canvas).toBeDefined('No canvas reference defined');
    });

    it('should call PixiService#setUp in ngOnInit', () => {
      fixture.detectChanges();
      expect(initSpy.calls.any()).toBe(true, 'PixiService#setUp has not been called');
    });

    it('should emit the resize event when calling onResize() if a resize value has been returned', () => {
      FakePixiService.RESIZEVAL = { x: 0, y: 0 };
      comp.onResize();
      expect(resizeSpy.calls.any()).toBe(true, 'resize event has not been emitted');
    });

    it('should not emit the resize event when calling onResize() if no resize value has been returned', () => {
      FakePixiService.RESIZEVAL = false;
      comp.onResize();
      expect(resizeSpy.calls.any()).not.toBe(true, 'resize event has been emitted');
    });
  });
