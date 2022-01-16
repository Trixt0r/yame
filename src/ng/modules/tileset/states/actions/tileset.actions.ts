import { Asset } from 'common/asset';
import { ITilesetSetting } from '../../interfaces';

export class SaveTilesetSettings {
  static readonly type = '[Tileset] Save tileset settings';
  constructor(public readonly asset: Asset, public readonly settings: Partial<ITilesetSetting>[]) {}
}
