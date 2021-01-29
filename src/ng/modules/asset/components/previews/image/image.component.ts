import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Asset } from 'common/asset';
import { IAssetPreviewComponent } from '../../../directives/preview.directive';

@Component({
  templateUrl: 'image.component.html',
  styleUrls: ['image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageAssetPreviewComponent implements IAssetPreviewComponent {

  /**
   * @inheritdoc
   */
  asset!: Asset;
}