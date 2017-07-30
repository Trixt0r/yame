import { GroupContent } from '../../content/group';
import { Asset } from "../../asset";

/**
 * The content representation of an asset group.
 *
 * A group of assets contains children of assets.
 *
 * @interface AssetGroupContent
 * @template T
 */

export interface AssetGroupContent<T extends Asset> extends GroupContent<T> {
}
