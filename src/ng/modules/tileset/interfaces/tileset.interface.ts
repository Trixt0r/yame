import { Asset } from 'common/asset';
import { ITilesetSetting } from './tileset-settings.interface';

export interface ITileset {
  asset: Asset;
  settings: ITilesetSetting[];
  width?: number;
  height?: number;
}
