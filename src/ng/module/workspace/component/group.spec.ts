import { DirectoryGroupComponent } from './groups/component/group/directory';
import { GroupComponentService } from '../service/group-component';
import { GroupDirective } from './groups/directive/group';
import { DirectoryContent } from '../../../../common/content/directory';
import { WorkspaceService } from '../service';
import { MaterialModule } from '../../material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GroupsComponent } from './groups';
import { AssetService } from '../service/asset';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement, Injectable, NgModule } from '@angular/core';
import convertDirectory from '../service/converter/directory';

@Injectable()
class FakeWorkspaceService {
  private dirContent = {
    path: '/myDir',
    name: 'myDir',
    type: 'directory',
    children: [{
      path: '/myDir/myDir',
      name: 'myDir',
      type: 'directory',
      children: [{
        path: '/myDir/myDir/myDir',
        name: 'myDir',
        type: 'directory',
        children: [],
      }],
    },{
      path: '/myDir/myDir2',
      name: 'myDir2',
      type: 'directory',
      children: [],
    }],
  };

  get directory(): DirectoryContent {
    return <any>this.dirContent;
  }
}

@NgModule({
  entryComponents: [
    DirectoryGroupComponent,
  ],
})
class TestModule { }

describe('GroupComponent', () => {
  let comp: GroupsComponent;
  let fixture: ComponentFixture<GroupsComponent>;
  let assetService: AssetService;
  let groupsService: GroupComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupsComponent,
        GroupDirective,
        DirectoryGroupComponent,
      ],
      imports: [
        NoopAnimationsModule,
        MaterialModule,
        TestModule
      ],
      providers: [
        { provide: WorkspaceService, useClass: FakeWorkspaceService },
        AssetService,
        GroupComponentService
       ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupsComponent);
    comp = fixture.componentInstance;

    assetService = fixture.debugElement.injector.get(AssetService);
    assetService.registerFsConverter('directory', convertDirectory);
    groupsService = fixture.debugElement.injector.get(GroupComponentService);
    groupsService.register('directory', DirectoryGroupComponent);
  });

  describe('initial', () => {
    it('should have a previous, content and next list', () => {
      fixture.detectChanges();
      let previous = fixture.debugElement.query(By.css('mat-list.prev'));
      let next = fixture.debugElement.query(By.css('mat-list.next'));
      let content = fixture.debugElement.query(By.css('mat-nav-list'));
      expect(previous).toBeDefined('No previous list defined');
      expect(previous).not.toBeNull('Previous list is null');
      expect(next).toBeDefined('No next list defined');
      expect(next).not.toBeNull('Next list is null');
      expect(content).toBeDefined('No content list defined');
      expect(content).not.toBeNull('Content list is null');
    });

    it('should not display the back button', () => {
      fixture.detectChanges();
      expect(comp.displayBack).toBe(false, 'Back button is shown');
    });
  });

  describe('ngOnInit', () => {
    it('should initialize the root directory', done => {
      comp.ngOnInit()
        .then(() => {
          expect(comp.current).toBeDefined('The current group is not defined');
          expect(comp.current).not.toBeNull('The current group is null');
          expect(comp.parents).toBeDefined('No parents array defined');
          expect(comp.parents.length).toBe(0, 'The root directory is not the root group');
        })
        .then(done);
    });

    it('should display 3 list items (root and 2 children)', done => {
      comp.ngOnInit()
        .then(() => {
          fixture.detectChanges();
          let re = fixture.debugElement.queryAll(By.css('mat-nav-list mat-list-item'));
          expect(re.length).toBe(3, 'Not 3 mat-list-items visible');
        })
        .then(done);
    });
  });

  describe('open', () => {

    let openingCalled: boolean;
    let openedCalled: boolean;

    beforeEach((done) => {
      openingCalled = false;
      openedCalled = false;
      let handler = { fn: (ev) => openingCalled = true };
      comp.opening.subscribe(handler.fn);
      handler = { fn: (ev) => openedCalled = true };
      comp.opened.subscribe(handler.fn);
      comp.ngOnInit().then(done);
    });

    it('should set the first child directory as the current group', () => {
      fixture.detectChanges();
      comp.open(<any>comp.current.members[0]);
      expect(comp.current).toBe(<any>comp.previous.members[0], 'The wrong group is currently set');
      expect(comp.parents.length).toBe(1, 'The root has not been pushed as a parent');
    });

    it('should switch back to the parent', () => {
      fixture.detectChanges();
      let prev = comp.current;
      comp.open(<any>comp.current.members[0]);
      comp.open(<any>comp.previous);
      expect(comp.current).toBe(prev, 'The wrong group is currently set');
      expect(comp.parents.length).toBe(0, 'The parents have not been reset');
    });

    it('should start the slide animation', done => {
      fixture.detectChanges();
      comp.open(<any>comp.current.members[0]);
      fixture.detectChanges();
      setTimeout(() => {
        expect(openingCalled).toBe(true, 'Animation has not been started');
        done();
      }, 200);
    });

    it('should finish the slide animation', done => {
      fixture.detectChanges();
      comp.open(<any>comp.current.members[0]);
      fixture.detectChanges();
      setTimeout(() => {
        expect(openedCalled).toBe(true, 'Animation has not been finished');
        done();
      }, 200);
    });
  });

  describe('slideAnimStart', () => {
    let openingCalled;

    beforeEach((done) => {
      openingCalled = false;
      let handler = { fn: (ev) => openingCalled = true };
      comp.opening.subscribe(handler.fn);
      comp.ngOnInit().then(done);
    });

    it('should emit the opening event', () => {
      comp.slideAnimStart({
        fromState: 'none',
        toState: 'open',
        totalTime: 1,
        phaseName: 'phaseName',
        element: fixture.componentRef.location.nativeElement,
        triggerName: 'start'
      });
      expect(openingCalled).toBe(true, 'Animation has not been started');
    });

    it('should lock the scrolling', () => {
      comp.slideAnimStart({
        fromState: 'none',
        toState: 'open',
        totalTime: 1,
        phaseName: 'phaseName',
        element: fixture.componentRef.location.nativeElement,
        triggerName: 'start'
      });
      expect((<HTMLElement>fixture.componentRef.location.nativeElement).classList.contains('no-overflow')).toBe(true, 'Scroll is not locked');
    });

    it('should not emit the opening event if we are animating already', () => {
      comp.slideAnimStart({
        fromState: 'open',
        toState: 'close',
        totalTime: 1,
        phaseName: 'phaseName',
        element: fixture.componentRef.location.nativeElement,
        triggerName: 'start'
      });
      expect(openingCalled).toBe(false, 'Animation has been started');
    });
  });

  describe('slideAnimDone', () => {
    let openedCalled;

    beforeEach((done) => {
      openedCalled = false;
      let handler = { fn: (ev) => openedCalled = true };
      comp.opened.subscribe(handler.fn);
      comp.ngOnInit().then(done);
    });

    it('should emit the opened event', () => {
      comp.slideAnimDone({
        fromState: 'none',
        toState: 'open',
        totalTime: 1,
        phaseName: 'phaseName',
        element: fixture.componentRef.location.nativeElement,
        triggerName: 'start'
      });
      expect(openedCalled).toBe(true, 'Animation has not been finished');
    });

    it('should unlock the scrolling', () => {
      comp.slideAnimDone({
        fromState: 'none',
        toState: 'open',
        totalTime: 1,
        phaseName: 'phaseName',
        element: fixture.componentRef.location.nativeElement,
        triggerName: 'start'
      });
      expect((<HTMLElement>fixture.componentRef.location.nativeElement).classList.contains('no-overflow')).toBe(false, 'Scroll is locked');
    });

    it('should not emit the opened event if we are animating already', () => {
      comp.slideAnimDone({
        fromState: 'close',
        toState: 'open',
        totalTime: 1,
        phaseName: 'phaseName',
        element: fixture.componentRef.location.nativeElement,
        triggerName: 'start'
      });
      expect(openedCalled).toBe(false, 'Animation has been finished');
    });
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });

});
