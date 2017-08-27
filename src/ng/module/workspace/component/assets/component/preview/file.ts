import { FileAsset } from '../../../../../../../common/asset/file';
import { Component } from '@angular/core';
import { AssetPreviewComponent } from './interface';
import { Asset } from '../../../../../../../common/asset';

@Component({
  template: `<md-icon class="no-preview">{{ 'web_asset' }}</md-icon>`,
  styles: [
    `md-icon {
      font-size: 100px;
      width: 100%;
      color: rgba(255, 255, 255, .7);
    }`
  ]
})
export class FileAssetPreviewComponent implements AssetPreviewComponent {

  asset: FileAsset;

}
