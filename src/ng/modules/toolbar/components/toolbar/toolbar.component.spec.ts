import { DefaultToolComponent } from '../tool/default/default.component';
import { NgModule, SimpleChange } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ToolbarComponent } from './toolbar.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// import { MaterialModule } from '../../../material.module';
import { Tool } from '../../tool';
import { By } from '@angular/platform-browser';
import { ToolDirective } from '../../directives/tool.directive';


@NgModule({
  entryComponents: [
    DefaultToolComponent,
  ],
})
class TestModule { }

describe('ToolbarComponent', () => {

  let comp: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        ToolDirective,
        ToolbarComponent,
        DefaultToolComponent
      ],
      imports: [
        NoopAnimationsModule,
        // MaterialModule,
        TestModule
      ],
      providers: [ ToolbarService ]
    }).compileComponents();
  fixture = TestBed.createComponent(ToolbarComponent);
  comp = fixture.componentInstance;
  service = TestBed.get(ToolbarService);
  service.register(new Tool('edit', 'edit'));
  });

  describe('initial', () => {

    it('should have a content div with a mat list and a toggler', () => {
      fixture.detectChanges();
      let content = fixture.debugElement.query(By.css('.content'));
      let list = fixture.debugElement.query(By.css('.content mat-nav-list'));
      let toggler = fixture.debugElement.query(By.css('.toggler'));
      expect(content).toBeDefined('No content defined');
      expect(content).not.toBeNull('Content is null');
      expect(list).toBeDefined('No list defined');
      expect(list).not.toBeNull('List is null');
      expect(toggler).toBeDefined('No toggler defined');
      expect(toggler).not.toBeNull('Toggler is null');
    });

    it('should be closed', () => {
      expect(comp.open).toBe(false, 'Toolbar is opened');
    });

  });

  describe('tools', () => {
    it('should display the initially registered tool', () => {
      fixture.detectChanges();
      let content = fixture.debugElement.query(By.css('mat-nav-list'));
      expect(content.children.length).toBe(1, 'Tool is not displayed');
    });

    it('should display new registered tools', done => {
      service.register(new Tool('settings', 'settings'))
        .then(() => {
          fixture.detectChanges();
          let content = fixture.debugElement.query(By.css('mat-nav-list'));
          expect(content.children.length).toBe(2, 'New tool is not displayed');
          done();
        })
        .catch(() => {
          console.log('caught');
          fail('Should not reject');
          done();
        });
    });
  });

  describe('toggle', () => {
    it('should set open to false if true', () => {
      comp.open = true;
      comp.toggle();
      expect(comp.open).toBe(false);
    });

    it('should set open to true if false', () => {
      comp.open = false;
      comp.toggle();
      expect(comp.open).toBe(true);
    });
  });

  describe('state', () => {
    it('should start opening itself if the open flag gets switched to true', done => {
      let handler = { fn: function() { } };
      let spy = spyOn(handler, 'fn');
      comp.opening.subscribe(handler.fn);
      comp.open = true;
      comp.ngOnChanges({ open: new SimpleChange(false, true, true) });
      fixture.detectChanges();
      expect((<any>comp).state).toEqual('open', 'Wrong animation state');
      setTimeout(() => {
        expect(spy.calls.any()).toBe(true, 'Opening event has not been triggered');
        done();
      });
    });

    it('should be opened after setting the open flag to true', done => {
      let handler = { fn: function() { } };
      let spy = spyOn(handler, 'fn');
      comp.opened.subscribe(handler.fn);
      comp.open = true;
      comp.ngOnChanges({ open: new SimpleChange(false, true, true) });
      fixture.detectChanges();
      expect((<any>comp).state).toEqual('open', 'Wrong animation state');
      setTimeout(() => {
        expect(spy.calls.any()).toBe(true, 'Opened event has not been triggered');
        done();
      });
    });

    it('should start closing itself if the open flag gets switched to true', done => {
      let handler = { fn: function() { } };
      let spy = spyOn(handler, 'fn');
      comp.closing.subscribe(handler.fn);
      comp.open = false;
      comp.ngOnChanges({ open: new SimpleChange(true, false, true) });
      fixture.detectChanges();
      expect((<any>comp).state).toEqual('closed', 'Wrong animation state');
      setTimeout(() => {
        expect(spy.calls.any()).toBe(true, 'Closing event has not been triggered');
        done();
      });
    });

    it('should be closed after setting the open flag to true', done => {
      let handler = { fn: function() { } };
      let spy = spyOn(handler, 'fn');
      comp.closed.subscribe(handler.fn);
      comp.open = false;
      comp.ngOnChanges({ open: new SimpleChange(true, false, true) });
      fixture.detectChanges();
      expect((<any>comp).state).toEqual('closed', 'Wrong animation state');
      setTimeout(() => {
        expect(spy.calls.any()).toBe(true, 'Closed has not been triggered');
        done();
      });
    });
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });

});
