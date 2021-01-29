import { Type } from '@angular/core';
import { ISortable } from 'common/interfaces/sortable.interface';

export interface IComponentSettings {
  [key: string]: unknown
}

/**
 * Settings option definition in the ui.
 */
export interface ISettingsOption<T = IComponentSettings> extends Partial<ISortable> {

  /**
   * The setting id, this option manipulates.
   */
  id: string;

  /**
   * The section this options lies in.
   */
  section: string;

  /**
   * The label of the option-
   */
  label: string;

  /**
   * The component to display.
   */
  component: Type<ISettingsOptionComponent>;

  /**
   * Any settings for the component visualization.
   */
  componentSettings?: T;
}

export interface ISettingsOptionComponent {
  option: ISettingsOption
}