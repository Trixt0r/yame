import { ISortable } from 'common/interfaces/sortable.interface';

export interface IPreferenceOption<T = any> extends Partial<ISortable> {

  /**
   * The id of the preference.
   */
  id: string;

  /**
   * The label of the preference.
   */
  label: string;

  /**
   * The action to dispatch.
   */
  action: T;

  /**
   * The icon of the preference, if any.
   */
  icon?: string;

  /**
   * The group to put the option in. Note, that groups will be separated by a horizontal line.
   */
  group?: number;
}