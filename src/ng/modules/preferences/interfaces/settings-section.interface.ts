import { ISortable } from 'common/interfaces/sortable.interface';

/**
 * Settings section definition in the ui.
 */
export interface ISettingsSection extends Partial<ISortable> {
  /**
   * The id of the section.
   */
  id: string;

  /**
   * The label of the section.
   */
  label: string;

  /**
   * The icon of the section.
   */
  icon?: string;
}