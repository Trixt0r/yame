import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FileAsset } from '../../../../common/asset/file';
import { DirectoryAsset } from '../../../../common/asset/directory';
import { AssetComponentService } from '../service/asset-component';
import { AssetPreviewDirective } from './assets/directive/asset-preview';
import { By } from '@angular/platform-browser';
import { MaterialModule } from '../../material';
import { UtilsModule } from '../../utils';
import { AssetsComponent } from './assets';
import { AssetService } from '../service/asset';
import { FileAssetPreviewComponent } from './assets/component/preview/file';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgModule, SimpleChange } from '@angular/core';
import { DndModule, DragDropService, DragDropConfig } from 'ng2-dnd';



@NgModule({
  entryComponents: [
    FileAssetPreviewComponent,
  ],
})
class TestModule { }

describe('AssetsComponent', () => {

  let comp: AssetsComponent;
  let fixture: ComponentFixture<AssetsComponent>;
  let assets: AssetComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        UtilsModule,
        MaterialModule,
        DndModule,
        TestModule
      ],
      declarations: [
        AssetsComponent,
        AssetPreviewDirective,
        FileAssetPreviewComponent
      ],
      providers: [
        AssetService,
        AssetComponentService,
        DragDropService,
        DragDropConfig
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetsComponent);
    comp = fixture.componentInstance;
    assets = fixture.debugElement.injector.get(AssetComponentService);
  });

  describe('initial', () => {
    it('should display nothing if no group is set', () => {
      fixture.detectChanges();
      let filledDe = fixture.debugElement.query(By.css('div.flex.wrap'));
      let emptyDe = fixture.debugElement.query(By.css('div.files-empty'));
      expect(filledDe).toBeNull('Filled container is visible');
      expect(emptyDe).toBeNull('Empty container is visible');
    });
  });

  describe('ngOnChanges', () => {
    it('should display the empy container of the current group has no assets', () => {
      comp.group = new DirectoryAsset();
      comp.ngOnChanges({ group: new SimpleChange(void 0, comp.group, true) });
      fixture.detectChanges();
      let filledDe = fixture.debugElement.query(By.css('div.flex.wrap'));
      let emptyDe = fixture.debugElement.query(By.css('div.files-empty'));
      expect(filledDe).toBeNull('Filled container is visible');
      expect(emptyDe).toBeDefined('Empty container is not visible');
      expect(emptyDe).not.toBeNull('Empty container is not visible');
      let cardDe = fixture.debugElement.query(By.css('div.files-empty > mat-card'));
      expect(cardDe).toBeDefined('No empty card defined');
      expect(cardDe).not.toBeNull('Empty card is null');
      expect((<HTMLElement>cardDe.nativeElement).innerText).toEqual('Group is empty', 'Invalid text');
    });

    it('should display the assets container if at least one asset is in the current group', () => {
      comp.group = new DirectoryAsset();
      let file = new FileAsset();
      file.content.name = 'file.test';
      file.content.path = file.id = '/file.test';
      file.parent = comp.group;
      comp.group.members.push(file);
      comp.ngOnChanges({ group: new SimpleChange(void 0, comp.group, true) });
      fixture.detectChanges();
      let filledDe = fixture.debugElement.query(By.css('div.flex.wrap'));
      let emptyDe = fixture.debugElement.query(By.css('div.files-empty'));
      expect(emptyDe).toBeNull('Empty container is visible');
      expect(filledDe).toBeDefined('Assets container is not defined');
      expect(filledDe).not.toBeNull('Assets container is not visible');

      let cardsDe = fixture.debugElement.queryAll(By.css('div.flex.wrap > mat-card'));
      expect(cardsDe.length).toBe(1, 'Wrong amount of cards is displayed');
    });
  });

  describe('menu options', () => {
    beforeEach(() => {
      comp.group = new DirectoryAsset();
      let file = new FileAsset();
      file.content.name = 'file.test';
      file.content.path = file.id = '/file.test';
      file.parent = comp.group;
      comp.group.members.push(file);
      comp.ngOnChanges({ group: new SimpleChange(void 0, comp.group, true) });
    });

    it('should not display the card actions if no options are set for the asset', () => {
      fixture.detectChanges();
      let optionsDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions'));
      expect(optionsDe).toBeNull('Card actions are visible');
    });

    it('should initialize the options menu if at least one option is set', () => {
      assets.registerMenuOptions(comp.group.members[0].type, [{
        title: 'myOption',
        callback: () => { }
      }]);
      fixture.detectChanges();
      let menuDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions mat-menu'));
      expect(menuDe).toBeDefined('Menu is not defined');
      expect(menuDe).not.toBeNull('Menu is not visible');
    });

    describe('single option', () => {
      it('should display an options button without icon', () => {
        assets.registerMenuOptions(comp.group.members[0].type, [{
          title: 'myOption',
          callback: () => { }
        }]);
        fixture.detectChanges();
        let optionsDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions'));
        expect(optionsDe).toBeDefined('No card actions defined');
        expect(optionsDe).not.toBeNull('Card actions not visible');
        let buttonDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button'));
        expect(buttonDe).toBeDefined('No options button defined');
        expect(buttonDe).not.toBeNull('Options button not visible');
        let contentDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button > span'));
        expect((<HTMLSpanElement>contentDe.nativeElement).innerText).toEqual('myOption');
        let iconDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button mat-icon'));
        expect(iconDe).toBeNull('Icon is visble');
      });

      it('should display an options button with icon', () => {
        assets.registerMenuOptions(comp.group.members[0].type, [{
          title: 'myOption',
          icon: 'an_icon',
          callback: () => { }
        }]);
        fixture.detectChanges();
        let iconDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button mat-icon'));
        expect(iconDe).toBeDefined('Icon is not defined');
        expect(iconDe).not.toBeNull('Icon is not visble');
        expect((<HTMLElement>iconDe.nativeElement).innerText).toEqual('an_icon');
      });

      it('should run the callback on click', () => {
        let called = false;
        assets.registerMenuOptions(comp.group.members[0].type, [{
          title: 'myOption',
          icon: 'an_icon',
          callback: () => called = true
        }]);
        fixture.detectChanges();
        let buttonDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button'));
        (<HTMLButtonElement>buttonDe.nativeElement).click();
        expect(called).toBe(true, 'Has not been called');
      });
    });

    describe('multiple option', () => {
      it('should show a dotted button for the menu', () => {
        assets.registerMenuOptions(comp.group.members[0].type, [{
          title: 'myOption',
          callback: () => { }
        }, {
          title: 'myOption2',
          callback: () => { }
        }]);
        fixture.detectChanges();
        let buttonDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button'));
        expect(buttonDe).toBeDefined('No options button defined');
        expect(buttonDe).not.toBeNull('Options button not visible');
        let iconDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button mat-icon'));
        expect(iconDe).toBeDefined('No icon defined');
        expect(iconDe).not.toBeNull('Wrong icon set');
        expect((<HTMLElement>iconDe.nativeElement).innerText).toEqual('more_vert');
      });

      it('should display as many menu options as registered', () => {
        assets.registerMenuOptions(comp.group.members[0].type, [{
          title: 'myOption',
          callback: () => { }
        }, {
          title: 'myOption2',
          callback: () => { }
        }]);
        fixture.detectChanges();
        let buttonDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button'));
        (<HTMLButtonElement>buttonDe.nativeElement).click();
        let buttonsDe = fixture.debugElement.queryAll(By.css('.cdk-overlay-pane .mat-menu-item'));
        expect(buttonsDe.length).toBe(2, 'Wrong amount of options is displayed');
      });

      it('should display as many menu options as registered', () => {
        let calls = [false, false];
        assets.registerMenuOptions(comp.group.members[0].type, [{
          title: 'myOption',
          callback: () => calls[0] = true
        }, {
          title: 'myOption2',
          callback: () => calls[1] = true
        }]);
        fixture.detectChanges();
        let buttonDe = fixture.debugElement.query(By.css('div.flex.wrap mat-card-actions > button'));
        (<HTMLButtonElement>buttonDe.nativeElement).click();
        let buttonsDe = fixture.debugElement.queryAll(By.css('.cdk-overlay-pane .mat-menu-item'));
        buttonsDe.forEach(button => (<HTMLButtonElement>button.nativeElement).click());
        calls.forEach((call, i) => expect(call).toBe(true, `Option ${i + 1} has not been called`));
      });
    });
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });

});
