import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { IPoint } from 'common/math';
import { AssetTabComponent, IAssetOwner } from 'ng/modules/asset';

@Component({
  selector: 'yame-tileset-tab',
  templateUrl: './tileset-tab.component.html',
  styleUrls: ['./tileset-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
@AssetTabComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class TilesetTabComponent implements IAssetOwner {
  static readonly icon = 'appstore';

  static readonly title = 'Tileset';

  asset!: Asset;

  size: IPoint = { x: 8, y: 8 };
  spacing: IPoint = { x: 0, y: 0 };
  offset: IPoint = { x: 0, y: 0 };
}
