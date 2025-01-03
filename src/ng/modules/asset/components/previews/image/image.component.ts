import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Asset } from 'common/asset';
import { AssetPreviewComponent } from '../../../decorators/preview.decorator';
import { IAssetOwner } from '../../../interfaces';

@Component({
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
@AssetPreviewComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class AssetImagePreviewComponent implements IAssetOwner {
  /**
   * @inheritdoc
   */
  asset!: Asset;
}
