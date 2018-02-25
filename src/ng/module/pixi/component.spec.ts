import { PixiService } from './service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement, Injectable } from '@angular/core';
import { PixiComponent } from './component';
import { DndModule, DragDropService, DragDropConfig, DragDropData } from 'ng2-dnd';
import { Map } from './scene/map';
import { Entity, EntityType } from './scene/entity';

@EntityType('someentity')
class MyEntity extends Entity {
  clone(): Promise<Entity> {
    throw new Error("Method not implemented.");
  }
}

@Injectable()
class FakePixiService {
  public static RESIZEVAL = null;
  private _scene = new Map();
  public get scene() { return this._scene; }
  setUp(ref, options) { /* NOOP */ }
  resize() { return FakePixiService.RESIZEVAL; }
  toScene(any) { return new PIXI.Point(1000, -1000); }
  createFromAsset(asset) { return Promise.resolve(new MyEntity()); }
}

describe('PixiComponent', () => {

    let comp: PixiComponent;
    let fixture: ComponentFixture<PixiComponent>;
    let initSpy: jasmine.Spy;
    let resizeSpy: jasmine.Spy;

    beforeEach(() => {

      TestBed.configureTestingModule({
        imports: [ DndModule ],
        declarations: [ PixiComponent ],
        providers: [ { provide: PixiService, useClass: FakePixiService }, DragDropService, DragDropConfig ],
      }).compileComponents();

      fixture = TestBed.createComponent(PixiComponent);
      const pixiService = fixture.debugElement.injector.get(PixiService);

      comp = fixture.componentInstance;
      initSpy = spyOn(pixiService, 'setUp');

      let resizeHandler = { fn: () => {} };
      resizeSpy = spyOn(resizeHandler, 'fn');
      comp.resized.subscribe(resizeHandler.fn);
    });

    describe('setup', () => {
      it('should have a canvas', () => {
        let de = fixture.debugElement.query(By.css('canvas'));
        expect(de.nativeElement).toBeDefined('No canvas element defined');
        expect(comp.canvas).toBeDefined('No canvas reference defined');
      });

      it('should call PixiService#setUp in ngOnInit', () => {
        fixture.detectChanges();
        expect(initSpy.calls.any()).toBe(true, 'PixiService#setUp has not been called');
      });
    });

    describe('resize', () => {
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

    describe('dnd', () => {

      let data: DragDropData;
      let pixiService: PixiService;

      beforeEach(() => {
        pixiService = fixture.debugElement.injector.get(PixiService);
        data = new DragDropData();
        data.dragData = { };
      });

      it('should add a new display object to the scene onDrop', (done) => {
        comp.onDrop(data)
          .then(obj => {
            expect(pixiService.scene.indexOf(obj)).toBeGreaterThanOrEqual(0, 'Child has not been added to scene');
            expect(obj.position.x).toBe(pixiService.toScene(data.mouseEvent).x, 'Added object has the wong x-coordinate');
            expect(obj.position.y).toBe(pixiService.toScene(data.mouseEvent).y, 'Added object has the wong y-coordinate');
            expect(comp.dndPreview).toBeUndefined('Preview has not been removed');
            done();
          }).catch(e => {
            fail('Nothing resolved');
            done();
          });
      });

      it('should add a new display object to the scene onDragEnter as preview', (done) => {
        comp.onDragEnter(data)
          .then(obj => {
            expect(comp.dndPreview).toBeDefined('No preview defined');
            expect(comp.dndPreview).toBe(obj, 'Preview is not the added instance');
            expect(comp.dndPreview.alpha).toBe(0.5, 'Preview has no 0.5 alpha value');
            expect(pixiService.scene.getChildIndex(obj)).toBeGreaterThanOrEqual(0, 'Preview has not been added to scene');
            expect(obj.position.x).toBe(pixiService.toScene(data.mouseEvent).x, 'Added object has the wong x-coordinate');
            expect(obj.position.y).toBe(pixiService.toScene(data.mouseEvent).y, 'Added object has the wong y-coordinate');
            done();
          }).catch(() => fail('Nothing resolved'));
      });

      it('should update the preview position onDragOver', (done) => {
        comp.onDragEnter(data)
          .then(obj => {
            comp.onDragOver(data);
            expect(comp.dndPreview.position.x).toBe(pixiService.toScene(data.mouseEvent).x, 'Added object has the wong x-coordinate');
            expect(comp.dndPreview.position.y).toBe(pixiService.toScene(data.mouseEvent).y, 'Added object has the wong y-coordinate');
            done();
          }).catch(() => {
            fail('Nothing resolved');
            done();
          });
      });

      it('should remove the preview onDragLeave', (done) => {
        comp.onDragEnter(data)
          .then(obj => {
            let prev = comp.dndPreview;
            comp.onDragLeave(data);
            expect(comp.dndPreview).toBeUndefined('Preview has not been removed');
            expect(pixiService.scene.children.indexOf(prev)).toBeLessThan(0, 'Preview has not been removed from scene');
            done();
          }).catch(() => {
            fail('Nothing resolved');
            done();
          });
      });
    });
  });
