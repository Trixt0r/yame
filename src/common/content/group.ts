/**
 * Representation of an group with any subcontent.
 *
 * A group of assets contains children of contents.
 *
 * @interface GroupContent
 * @template T
 */

export interface GroupContent<T> {

  /** @type {T[]} The children (members) of this group. */
  children: T[];

}
