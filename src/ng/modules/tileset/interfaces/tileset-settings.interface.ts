import { IPoint } from 'common/math';

export interface ITilesetSetting {
  id: number;
  label: string;
  size: IPoint;
  spacing: IPoint;
  offset: IPoint;
  selections: IPoint[];
}
