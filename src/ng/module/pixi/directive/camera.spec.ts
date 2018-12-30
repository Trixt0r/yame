import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PixiComponent } from '../component';
import { PixiService } from '../service';
import { PixiCameraDirective } from './camera';
import { DndModule, DragDropService, DragDropConfig } from 'ng2-dnd';
import { NgxsModule } from '@ngxs/store';
import { SceneState } from '../ngxs/state';

@Component({
  template: `<yame-pixi pixiCamera></yame-pixi>`,
})
class TestGroupHostComponent {}

describe('PixiGridDirective', () => {
  let comp: TestGroupHostComponent;
  let fixture: ComponentFixture<TestGroupHostComponent>;
  let directive: PixiCameraDirective;
  let service: PixiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DndModule,
        NgxsModule.forRoot([SceneState]),
      ],
      declarations: [TestGroupHostComponent, PixiComponent, PixiCameraDirective],
      providers: [PixiService, DragDropService, DragDropConfig],
    }).compileComponents();
    fixture = TestBed.createComponent(TestGroupHostComponent);
    comp = fixture.componentInstance;
    const dirEl = fixture.debugElement.query(By.directive(PixiCameraDirective));
    directive = dirEl.injector.get(PixiCameraDirective);
    fixture.detectChanges();
    directive.ngAfterViewInit();

    service = fixture.debugElement.injector.get(PixiService);
    service.renderer.plugins.interaction.eventData.data = {
      getLocalPosition: (target, from, point) => point,
    };
  });

  afterEach(() => {
    if (service.app) return service.dispose();
  });

  describe('initialization', () => {
    it('should initialize a camera', () => {
      expect(directive.camera).toBeDefined('No camera has been defined');
    });

    it('should attach the camera to the scene', () => {
      expect(directive.camera.isAttached()).toBe(true, 'Directive camera is not attached');
    });
  });

  describe('onMouseWheel', () => {
    it('should not execute if not interactive', () => {
      const mouseData = <MouseWheelEvent>{ deltaY: 1 };
      const prevZoom = directive.camera.zoom;
      directive.interactive = false;
      directive.onMouseWheel(mouseData);
      expect(prevZoom).toBe(directive.camera.zoom, 'Camera has been zoomed out');
    });

    it('should zoom the camera in on mousewheel up', () => {
      const mouseData = <MouseWheelEvent>{ deltaY: -1 };
      const prevZoom = directive.camera.zoom;
      directive.onMouseWheel(mouseData);
      expect(prevZoom).toBeLessThan(directive.camera.zoom, 'Camera has not been zoomed in');
    });

    it('should zoom the camera out on mousewheel down', () => {
      const mouseData = <MouseWheelEvent>{ deltaY: 1 };
      const prevZoom = directive.camera.zoom;
      directive.onMouseWheel(mouseData);
      expect(prevZoom).toBeGreaterThan(directive.camera.zoom, 'Camera has not been zoomed out');
    });

    it('should update the target position', () => {
      const mouseData = <MouseWheelEvent>{ deltaY: -1, clientX: 500, clientY: 300 };
      const prevPosition = directive.camera.targetPosition.clone();
      directive.onMouseWheel(mouseData);
      expect(directive.camera.targetPosition.x).not.toBe(prevPosition.x, 'x target position has not changed');
      expect(directive.camera.targetPosition.y).not.toBe(prevPosition.y, 'y target position has not changed');
    });
  });

  describe('onMouseDown', () => {
    it('should not execute if not interactive', () => {
      const mouseData = <MouseWheelEvent>{ deltaY: 1 };
      directive.interactive = false;
      directive.onMouseDown(mouseData);
      expect(directive['prevPos']).toBeNull('Clicked position has been set');
    });

    it('should not be executed if the right mouse button is not pressed', () => {
      const mouseData = <MouseEvent>{ which: 1 };
      directive.onMouseDown(mouseData);
      expect(directive['prevPos']).toBeNull('Clicked position has been set');
    });

    it('should be executed if the right mouse button has been pressed', () => {
      const mouseData = <MouseEvent>{
        which: 3,
        clientX: 5,
        clientY: 5,
      };
      directive.onMouseDown(mouseData);
      expect(directive['prevPos']).not.toBeNull('Clicked position has not been set');
      expect(directive['prevPos'].x).toBe(5, 'x position has not been set properly');
      expect(directive['prevPos'].y).toBe(5, 'y position has not been set properly');
    });
  });

  describe('onMouseUp', () => {
    it('should not execute if not interactive', () => {
      directive.onMouseDown(<MouseEvent>{ which: 3 });
      const mouseData = <MouseEvent>{ which: 3 };
      directive.interactive = false;
      directive.onMouseUp(mouseData);
      expect(directive['prevPos']).not.toBeNull('Clicked position has been removed');
    });

    it('should not be executed if the right mouse button is not pressed', () => {
      directive.onMouseDown(<MouseEvent>{ which: 3 });
      const mouseData = <MouseEvent>{ which: 1 };
      directive.onMouseUp(mouseData);
      expect(directive['prevPos']).not.toBeNull('Clicked position has been removed');
    });

    it('should be executed if the right mouse button has been pressed', () => {
      directive.onMouseDown(<MouseEvent>{ which: 3 });
      const mouseData = <MouseEvent>{
        which: 3,
        clientX: 5,
        clientY: 5,
      };
      directive.onMouseUp(mouseData);
      expect(directive['prevPos']).toBeNull('Clicked position has not been removed');
    });
  });

  describe('onMouseMove', () => {
    it('should not execute if not interactive', () => {
      directive.onMouseDown(<MouseEvent>{ which: 3 });
      const mouseData = <MouseEvent>{ which: 3 };
      const prevPos = new PIXI.Point(directive.camera.position.x, directive.camera.position.y);
      directive.interactive = false;
      directive.onMouseMove(mouseData);
      expect(prevPos.x).toBe(directive.camera.position.x, 'x position for camera has been updated');
      expect(prevPos.y).toBe(directive.camera.position.y, 'y position for camera has been updated');
    });

    it('should not be executed if the right mouse button is not pressed', () => {
      directive.onMouseDown(<MouseEvent>{ which: 3 });
      const mouseData = <MouseEvent>{ which: 1 };
      const prevPos = new PIXI.Point(directive.camera.position.x, directive.camera.position.y);
      directive.onMouseMove(mouseData);
      expect(prevPos.x).toBe(directive.camera.position.x, 'x position for camera has been updated');
      expect(prevPos.y).toBe(directive.camera.position.y, 'y position for camera has been updated');
    });

    it('should not be executed if the right mouse button has not been pressed before', () => {
      const mouseData = <MouseEvent>{ which: 3 };
      const prevPos = new PIXI.Point(directive.camera.position.x, directive.camera.position.y);
      directive.onMouseMove(mouseData);
      expect(prevPos.x).toBe(directive.camera.position.x, 'x position for camera has been updated');
      expect(prevPos.y).toBe(directive.camera.position.y, 'y position for camera has been updated');
    });

    it('should be executed if the right mouse button is pressed and has been pressed before', () => {
      directive.onMouseDown(<MouseEvent>{ which: 3, clientX: 0, clientY: 0 });
      const mouseData = <MouseEvent>{ which: 3, clientX: 5, clientY: 5 };
      const prevPos = new PIXI.Point(directive.camera.position.x, directive.camera.position.y);
      directive.onMouseMove(mouseData);
      expect(prevPos.x).not.toBe(directive.camera.position.x, 'x position for camera has not been updated');
      expect(prevPos.x).not.toBe(5, 'x position for camera has not been updated');
      expect(prevPos.y).not.toBe(directive.camera.position.y, 'y position for camera has not been updated');
      expect(prevPos.y).not.toBe(5, 'y position for camera has not been updated');
    });
  });
});
