import { Component, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PixiComponent } from '../component';
import { PixiService } from '../service';
import { PixiGridDirective } from './grid';
import { Camera } from '../utils/camera';
import { DndModule, DragDropService, DragDropConfig } from 'ng2-dnd';

@Component({
  template: `<pixi pixiGrid></pixi>`
})
class TestGroupHostComponent {
}

describe('PixiGridDirective', () => {

  let comp: TestGroupHostComponent;
  let fixture: ComponentFixture<TestGroupHostComponent>;
  let directive: PixiGridDirective;
  let service: PixiService;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ DndModule ],
      declarations: [ TestGroupHostComponent, PixiComponent, PixiGridDirective ],
      providers: [ PixiService, DragDropService, DragDropConfig ]
    }).compileComponents();
    fixture = TestBed.createComponent(TestGroupHostComponent);
    comp = fixture.componentInstance;
    let dirEl = fixture.debugElement.query(By.directive(PixiGridDirective));
    directive = dirEl.injector.get(PixiGridDirective);
    fixture.detectChanges();
    directive.ngAfterViewInit();
    service = fixture.debugElement.injector.get(PixiService);
  });


  afterEach(() => {
    if (service.app)
      return service.dispose()
  });

  it('should initialize a grid', () => {
    expect(directive.grid).toBeDefined('No grid has been defined');
  });

  it('should update the grid', () => {
    let spy = spyOn(directive.grid, 'update');
    directive.update();
    expect(spy.calls.any()).toBe(true, 'update() has not been called on the grid');
  });

  it('should listen to camera updates', () => {
    let cam = new Camera();
    directive.listenToCamera(cam);
    let spy = spyOn(directive.grid, 'update');
    cam.emit('updated');
    expect(spy.calls.any()).toBe(true, 'update() has not been called on the camera update event');
  });

  it('should not listen to old camera updates', () => {
    let oldCam = new Camera();
    directive.listenToCamera(oldCam);
    directive.listenToCamera(new Camera());
    let spy = spyOn(directive.grid, 'update');
    oldCam.emit('updated');
    expect(spy.calls.any()).toBe(false, 'update() should not have been called on the old camera update event');
  });

});
