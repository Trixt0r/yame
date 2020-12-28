import { Asset } from 'common/asset';
import { IResource } from 'common/interfaces/resource';

export interface IAssetsSource {

  /**
   * Unique type identifier.
   */
  type: string;

  /**
   * The origin for the assets source.
   */
  origin: string;

  /**
   * The label to display.
   */
  label: string;

  /**
   * The icon to display.
   */
  icon?: string;
}

export class LoadFromAssetsSource {
  public static readonly type = '[Asset] Load assets source';

  constructor(public source: IAssetsSource) { }
}

export class UnloadAssetsSource {
  public static readonly type = '[Asset] Unload assets source';

  constructor(public source: IAssetsSource) { }
}

export class UpdateAssetsSource {
  public static readonly type = '[Asset] Update assets folder';

  constructor(public source: IAssetsSource) { }
}

export class AddAssetsSource {
  public static readonly type = '[Asset] Add assets source';

  constructor(public source: IAssetsSource) { }
}

export class RemoveAssetsSource {
  public static readonly type = '[Asset] Remove assets source';

  constructor(public type: string) { }
}

export class SetAssetsRoot {
  public static readonly type = '[Asset] Set asset root';

  constructor(public readonly root: string) { }
}

export class AddAsset {
  public static readonly type = '[Asset] Add asset';

  constructor(public asset: Asset | Asset[]) { }
}

export class RemoveAsset {
  public static readonly type = '[Asset] Remove asset';

  constructor(public id: string | string[]) { }
}

export class UpdateAsset {
  public static readonly type = '[Asset] Update asset';

  constructor(public asset: Asset | Asset[]) { }
}

export class ScanResource {
  public static readonly type = '[Asset] Scan Resource';

  constructor(public uri: string, public source: string, public type = 'group') { }
}

export class LoadAssetResource {
  public static readonly type = '[Asset] Load asset resource';

  constructor(public resource: IResource, public force: boolean = false) { }
}

export class SelectAssetGroup {
  public static readonly type = '[Asset] Select asset group';

  constructor(public asset: Asset) { }
}

export class UnselectAssetGroup {
  public static readonly type = '[Asset] Unselect asset group';

  constructor() { }
}

export class SelectAsset {
  public static readonly type = '[Asset] Select asset';

  constructor(public asset: Asset) { }
}

export class UnselectAsset {
  public static readonly type = '[Asset] Unselect asset';

  constructor() { }
}

export class RegisterAssetIcon {
  public static readonly type = '[Asset] Register asset icon';

  constructor(public icon: string, public types: string[]) { }
}