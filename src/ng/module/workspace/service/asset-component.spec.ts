import { EmptyAssetComponentMenuOptions } from '../exception/service/empty-asset-component-menu-options';
import { AssetPreviewComponent } from '../component/assets/component/preview/interface';
import { AssetComponentService } from './asset-component';

class MyAssetPreviewComponent implements AssetPreviewComponent {
  asset: any;
}
class MyAssetPreviewComponent2 implements AssetPreviewComponent {
  asset: any;
}

describe('AssetComponentService', () => {

  let service: AssetComponentService;

  beforeEach(() => {
    service = new AssetComponentService();
  });

  describe('preview', () => {
    it ('should register a preview for the type "myType"', () => {
      service.registerPreview('myType', MyAssetPreviewComponent);
      expect(service.getPreview('myType')).toBeDefined('No preview defined for type "myType"');
      expect(service.getPreview('myType')).not.toBeNull('Preview for type "myType" is null');
      expect(service.getPreview('myType')).toBe(MyAssetPreviewComponent, 'The incorrect preview component is defined');
    });

    it ('should have no registered preview component for an unknown asset type', () => {
      expect(service.getPreview('unknownType')).toBeUndefined('Preview defined for type "unknownType"');
    });

    it ('should allow to override a preview for an asset type', () => {
      service.registerPreview('myType', MyAssetPreviewComponent);
      expect(service.getPreview('myType')).toBe(MyAssetPreviewComponent, 'The incorrect preview component is defined');
      service.registerPreview('myType', MyAssetPreviewComponent2);
      expect(service.getPreview('myType')).toBe(MyAssetPreviewComponent2, 'The preview component has not been overriden');
    });
  });

  describe('preview', () => {
    it ('should register menu options for the type "myType"', () => {
      let options = [{ title: 'test', callback: () => { } }];
      service.registerMenuOptions('myType', options);
      expect(service.getMenuOptions('myType')).toBeDefined('No menu options defined for type "myType"');
      expect(service.getMenuOptions('myType')).not.toBeNull('Menu options for type "myType" are null');
      expect(service.getMenuOptions('myType')).toBe(options, 'The incorrect menu options are defined');
    });

    it ('should throw an EmptyAssetComponentMenuOptions if the registered options are empty', () => {
      let options = [];
      try {
        service.registerMenuOptions('myType', options);
      } catch (e) {
        expect(e instanceof EmptyAssetComponentMenuOptions).toBe(true, 'No instance of EmptyAssetComponentMenuOptions has been thrown');
      }
      expect(() => service.registerMenuOptions('myType', options)).toThrowError('Make sure you have at least one option defined!');
    });

    it ('should have empty menu options for an unknown asset type', () => {
      expect(service.getMenuOptions('unknownType')).toBeDefined('Menu options should always consist of an empty array');
      expect(service.getMenuOptions('unknownType').length).toBe(0, 'The menu options are not empty');
    });

    it ('should allow to override a preview for an asset type', () => {
      let options = [{ title: 'test', callback: () => { } }];
      let options2 = [{ title: 'test1', callback: () => { } }];
      service.registerMenuOptions('myType', options);
      expect(service.getMenuOptions('myType')).toBe(options, 'The incorrect menu options are defined');
      service.registerMenuOptions('myType', options2);
      expect(service.getMenuOptions('myType')).toBe(options2, 'The menu options have not been overriden');
    });
  });

});
