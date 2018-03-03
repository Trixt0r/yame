import { AssetComponentService } from '../../../service/asset-component';
import { FileAsset } from '../../../../../../common/asset/file';
import { AssetPreviewDirective } from './asset-preview';
import { AssetPreviewComponent } from '../component/preview/interface';
import { MaterialModule } from '../../../../material';
import { By } from '@angular/platform-browser';
import { DirectoryAsset } from '../../../../../../common/asset/directory';
import { Asset } from '../../../../../../common/asset';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, NgModule } from '@angular/core';
import { FileAssetPreviewComponent } from '../component/preview/file';

@Component({
  template: `<div [assetPreview]="asset"></div>`
})
class TestAssetPreviewComponent implements AssetPreviewComponent {
  asset: Asset;
}

@NgModule({
  entryComponents: [
    FileAssetPreviewComponent,
  ],
})
class TestModule { }

describe('AssetPreviewDirective', () => {

  let comp: TestAssetPreviewComponent;
  let fixture: ComponentFixture<TestAssetPreviewComponent>;
  let directive: AssetPreviewDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, TestModule],
      declarations: [TestAssetPreviewComponent, AssetPreviewDirective, FileAssetPreviewComponent],
      providers: [ AssetComponentService ]
    }).compileComponents();
    fixture = TestBed.createComponent(TestAssetPreviewComponent);
    comp = fixture.componentInstance;
    let dirEl = fixture.debugElement.query(By.directive(AssetPreviewDirective));
    directive = dirEl.injector.get(AssetPreviewDirective);
    comp.asset = new FileAsset();
    fixture.detectChanges();
  });

  describe('initial', () => {
    it('should have the same asset as the host component', () => {
      expect(directive.asset).toBe(comp.asset, 'Directive asset is not the same as the component asset');
    });
  });

  describe('ngOnChanges', () => {
    it('shoud not call the render method if no asset changes happened', () => {
      let spy = spyOn(directive, 'render');
      directive.ngOnChanges({});
      expect(spy.calls.any()).toBe(false, 'render() has been called');
    });

    it('should call the render method if the asset changed', () => {
      let spy = spyOn(directive, 'render');
      directive.ngOnChanges({ asset: { } });
      expect(spy.calls.any()).toBe(true, 'render() has not been called');
    });
  });

  describe('render', () => {
    it('shoud not render an unknown asset', () => {
      expect(directive.render()).toBe(null, 'The unknown asset has been rendered');
    });

    it('shoud render an asset component for a known asset', () => {
      let service = fixture.debugElement.injector.get(AssetComponentService);
      service.registerPreview('file', FileAssetPreviewComponent);
      let ref = directive.render();
      expect(ref).not.toBe(null, 'The asset has not been rendered');
      expect(ref.instance instanceof FileAssetPreviewComponent).toBe(true, 'An asset component has not been rendered');
    });
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
});
