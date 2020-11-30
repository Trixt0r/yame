import { Asset } from 'common/asset';

export class RequestAssetsRoot {
  public static readonly type = '[Asset] Request asset root';
}

export class SetAssetsRoot {
  public static readonly type = '[Asset] Set asset root';

  constructor(public readonly root: string) {}
}

export class AddAsset {
  public static readonly type = '[Asset] Add asset';

  constructor(public asset: Asset | Asset[]) {}
}

export class DeleteAsset {
  public static readonly type = '[Asset] Remove asset';

  constructor(public id: string | string[]) { }
}

export class UpdateAsset {
  public static readonly type = '[Asset] Update asset';

  constructor(public asset: Asset | Asset[]) { }
}
