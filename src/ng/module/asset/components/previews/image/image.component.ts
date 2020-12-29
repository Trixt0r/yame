import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Asset } from 'common/asset';
import { AssetPreviewComponent } from 'ng/module/asset/decorators/preview.decorator';
import { IAssetPreviewComponent } from '../../../directives/preview.directive';

@Component({
  templateUrl: 'image.component.html',
  styleUrls: ['image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@AssetPreviewComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class ImageAssetPreviewComponent implements IAssetPreviewComponent {

  /**
   * @inheritdoc
   */
  asset!: Asset;
}
