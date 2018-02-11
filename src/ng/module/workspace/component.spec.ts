import { DirectoryContent } from '../../../common/content/directory';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GroupComponentService } from './service/group-component';
import { AssetComponentService } from './service/asset-component';
import { DialogProvider } from '../electron/provider/dialog';
import { DirectoryProvider } from '../electron/provider/directory';
import { AssetService } from './service/asset';
import { WorkspaceService } from './service';
import { ImageAssetPreviewComponent } from './component/assets/component/preview/image';
import { FileAssetPreviewComponent } from './component/assets/component/preview/file';
import { DirectoryGroupComponent } from './component/groups/component/group/directory';
import { AssetPreviewDirective } from './component/assets/directive/asset-preview';
import { GroupDirective } from './component/groups/directive/group';
import { UtilsModule } from '../utils';
import { MaterialModule } from '../material';
import { GroupsComponent } from './component/groups';
import { AssetsComponent } from './component/assets';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement, Injectable } from '@angular/core';
import { ElectronService } from '../electron/service';
import { MockedService } from '../electron/provider/mocked-service';
import { WorkspaceComponent } from './component';
import convertDirectory from './service/converter/directory';
import convertImage from './service/converter/image';
import { DndModule } from 'ng2-dnd';

describe('WorkspaceComponent', () => {
  let comp: WorkspaceComponent;
  let fixture: ComponentFixture<WorkspaceComponent>;
  let assetService: AssetService;
  let electron: ElectronService;
  let ipcSendSpy: jasmine.Spy;

  let loadSuccess = () => {
    let id = ipcSendSpy.calls.mostRecent().args[2];
    electron.ipc.emit(`dialog:open:${id}`, {}, ['myDir']); // Fake open directory
    setTimeout(() => {
      id = ipcSendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:done`, {}, { // Fake directory scan
        path: 'myDir',
        children: [],
        type: 'directory'
      });
    });
  };

  let loadFail = () => {
    let id = ipcSendSpy.calls.mostRecent().args[2];
    electron.ipc.emit(`dialog:open:${id}`, {}, ['myDir']); // Fake open directory
    setTimeout(() => {
      id = ipcSendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:fail`, {}, {}); // Fake directory scan
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        WorkspaceComponent,
        GroupsComponent,
        AssetsComponent,
        GroupDirective,
        AssetPreviewDirective,
        DirectoryGroupComponent,
        FileAssetPreviewComponent,
        ImageAssetPreviewComponent,
      ],
      imports: [
        NoopAnimationsModule,
        UtilsModule,
        DndModule,
        MaterialModule
      ],
      providers: [
        { provide: ElectronService, useClass: MockedService },
        AssetService,
        WorkspaceService,
        GroupComponentService,
        AssetComponentService
       ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceComponent);
    assetService = fixture.debugElement.injector.get(AssetService);
    electron = fixture.debugElement.injector.get(ElectronService);
    electron.registerProvider(DirectoryProvider);
    electron.registerProvider(DialogProvider);
    ipcSendSpy = spyOn(electron.ipc, 'send');

    assetService.registerFsConverter('directory', convertDirectory);
    assetService.registerFsConverter('png', convertImage);

    comp = fixture.componentInstance;
  });

  describe('initial', () => {
    it('should have empty content', () => {
      expect(comp.content).toBeNull('The content is initialized');
    });

    it('should show a button if no folder has been chosen yet', () => {
      fixture.detectChanges();
      let deButton = fixture.debugElement.query(By.css('button.absolute.vert-center'));
      expect(deButton).not.toBeNull('No button element defined');
    });
  });

  describe('openFolder', () => {
    it('should remove the button, show the groups, assets and resizer on success', done => {
      fixture.detectChanges();
      let deGroups = fixture.debugElement.query(By.css('groups'));
      let deAssets = fixture.debugElement.query(By.css('assets'));
      let deResize = fixture.debugElement.query(By.css('resizable'));
      expect(deGroups).toBeNull('Groups element defined');
      expect(deAssets).toBeNull('Assets element defined');
      expect(deResize).toBeNull('Resizable element defined');
      comp.openFolder()
        .then(() =>{
          fixture.detectChanges();
          deGroups = fixture.debugElement.query(By.css('groups'));
          deAssets = fixture.debugElement.query(By.css('assets'));
          deResize = fixture.debugElement.query(By.css('resizable'));
          expect(deGroups).not.toBeNull('Groups element not defined');
          expect(deAssets).not.toBeNull('Assets element not defined');
          expect(deResize).not.toBeNull('Resizable element not defined');
          let deButton = fixture.debugElement.query(By.css('button.absolute.vert-center'));
          expect(deButton).toBeNull('A button element still defined');

          expect(comp.groupsComponent).not.toBeNull('groupsComponent still is not assigned');
          expect(comp.assetsComponent).not.toBeNull('assetsComponent still is not assigned');
          expect(comp.resizer).not.toBeNull('resizer still is not assigned');
          done();
        });
      loadSuccess();
    });

    it('should select the root as the selected asset group on success', done => {
      comp.openFolder()
        .then(re =>{
          expect(comp.assetGroup).not.toBeNull('No asset group assigned');
          expect(comp.assetGroup.id).toEqual('myDir', 'The wrong asset group has been selected');
          done();
        });
      loadSuccess();
    });

    it('should resolve true on success', done => {
      comp.openFolder()
        .then(re =>{
          expect(re).toBe(true);
          done();
        });
      loadSuccess();
    });

    it('should resolve false on fail', done => {
      comp.openFolder()
        .then(re =>{
          expect(re).toBe(false);
          done();
        });
        loadFail();
    });
  });

  describe('onGroupSelect', () => {
    beforeEach(done => {
      comp.openFolder()
        .then(() => fixture.detectChanges())
        .then(done);
      loadSuccess();
    });

    it('should apply the selection from the groups component to the workspace', done => {
      let dir = {
        path: 'myDir',
        children: [],
        type: 'directory'
      };
      assetService.fromFs(<any>dir)
        .then(group => comp.groupsComponent.open(<any>group))
        .then(() => fixture.detectChanges())
        .then(() => expect(comp.assetGroup).toBe(comp.groupsComponent.current, 'The asset groups do not match'))
        .then(done);
    });

    it('should assign the selected asset group to the assets component', done => {
      let dir = {
        path: 'myDir',
        children: [],
        type: 'directory'
      };
      assetService.fromFs(<any>dir)
        .then(group => comp.groupsComponent.open(<any>group))
        .then(() => fixture.detectChanges())
        .then(() => expect(comp.assetsComponent.group).toBe(comp.assetGroup, 'The asset groups do not match'))
        .then(done);
    });
  });

  describe('updateColumns', () => {

    it('should not apply the new size to the assets and groups component if no folder has been loaded yet', () => {
      let re = comp.updateColumns(400);
      expect(re).toBe(false, 'The value has been applied to the columns');
    });

    it('should apply the new size to the assets and groups components', done => {
      comp.openFolder()
      .then(() => fixture.detectChanges())
      .then(() => {
        let re = comp.updateColumns(400);
        expect(re).toBe(true, 'The value has not been applied to the columns');
        fixture.detectChanges();
        let fullWidth = comp.row.nativeElement.offsetWidth;
        expect(comp.groupsComponent.ref.nativeElement.style.width).toBe('400px', 'The groups component has the wrong width');
        expect(comp.groupsComponent.ref.nativeElement.style['max-width']).toBe('400px', 'The groups component has the wrong max-width');
        expect(comp.assetsComponent.ref.nativeElement.style.left).toBe('405px', 'The assets component has the wrong position');
        expect(comp.assetsComponent.ref.nativeElement.style['max-width']).toBe(`${fullWidth - 405}px`, 'The assets component has the wrong max width');
        expect(comp.assetsComponent.ref.nativeElement.style.width).toBe(`${fullWidth - 405}px`, 'The assets component has the wrong width');
      })
      .then(done);
      loadSuccess();
    });
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
});
