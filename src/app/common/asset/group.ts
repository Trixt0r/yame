import { Asset } from '../asset';

/**
 * An asset group represents an asset which contains asset members.
 *
 * @export
 * @abstract
 * @class AssetGroup
 * @extends {Asset}
 * @template T The type of the members in the group.
 */
export abstract class AssetGroup<T extends Asset> extends Asset {

  /** @inheritdoc */
  get type(): string {
    return 'group';
  }

  /** @type {T[]} A list of the (direct) group members. */
  members: T[] = [];
}
