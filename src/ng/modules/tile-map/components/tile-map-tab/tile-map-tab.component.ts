import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Asset } from 'common/asset';
import { AssetTabComponent, IAssetOwner } from 'ng/modules/asset';

@Component({
  selector: 'yame-tile-map-tab',
  templateUrl: './tile-map-tab.component.html',
  styleUrls: ['./tile-map-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
@AssetTabComponent()
export class TileMapTabComponent implements IAssetOwner {
  static readonly icon = 'appstore';

  static readonly title = 'Tilemap';

  asset!: Asset;
}
