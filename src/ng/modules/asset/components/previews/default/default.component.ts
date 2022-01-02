import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Asset } from 'common/asset';
import { IAssetOwner } from '../../../interfaces';

@Component({
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetDefaultPreviewComponent implements IAssetOwner {
  asset!: Asset;
}
