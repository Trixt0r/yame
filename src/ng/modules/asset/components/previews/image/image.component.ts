import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Asset } from 'common/asset';
import { AssetPreviewComponent } from 'ng/modules/asset/decorators/preview.decorator';
import { IAssetPreviewComponent } from '../../../directives/preview.directive';

@Component({
  templateUrl: 'image.component.html',
  styleUrls: ['image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@AssetPreviewComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class AssetImagePreviewComponent implements IAssetPreviewComponent {
  /**
   * @inheritdoc
   */
  asset!: Asset;
}
