import { Type } from '@angular/core';
import { Asset } from 'common/asset';

export interface IAssetDetailsComponent extends Type<Record<string, unknown>> {
  label: string;
  isVisibleFor?(asset?: Asset<unknown>): boolean;
}
