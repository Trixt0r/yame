import { SceneComponent } from '../component';

/**
 * The group component can hold a group of components, i.e. an array of their ids.
 */
export interface GroupSceneComponent extends SceneComponent {

  /**
   * The ids of the members.
   */
  members: string[];

  /**
   * A list of member types, which can be attached to this group.
   * Empty means that no type can be added.
   * `undefined` or `null` means any type can be added.
   */
  allowedMemberTypes?: string[];

  /**
   * A list of member items, which can be attached to this group.
   * Empty means that no item can be added.
   * `undefined` or `null` means any item can be added.
   */
  allowedMemberItems?: string[];

  /**
   * Whether to expand the group in the gui or not.
   */
  expanded?: boolean;
}

/**
 * Creates a group component with the give parameters.
 *
 * @param id
 * @param members
 * @param group
 */
export function createGroupComponent(id: string, members: string[] = [], group?: string): GroupSceneComponent {
  return {
    id,
    members,
    type: 'group',
    group
  };
}

/**
 * Searches for all components which are members of the given group component.
 * The algorithm assumes, that the components are hold in a flat list.
 *
 * @param component The group to search in.
 * @param source A list of all components.
 * @param [recursive=false] Whether to recursively search also in group components.
 */
export function getMemberComponents<T extends SceneComponent>(component: GroupSceneComponent, source: readonly T[], recursive = false) {
  const memberComponents: SceneComponent[] = [];
  source.forEach(it => {
    if (it.group === component.id) {
      memberComponents.push(it);
      if (recursive && it.type === 'group')
        getMemberComponents(it as unknown as GroupSceneComponent, source, true).forEach(comp => memberComponents.push(comp));
    }
  });
  return memberComponents;
}
