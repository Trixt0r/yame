import { FileAsset } from './file';

export class ImageAsset extends FileAsset {

  /** @inheritdoc */
  get type(): string {
    return 'image';
  }

}
