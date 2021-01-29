import { IPreferenceOption } from '../../interfaces/preference-option.interface';

export class AddPreferenceOption {
  static type = '[Preferences] Add preference option';
  constructor(public option: IPreferenceOption | IPreferenceOption[]) { }
}

export class RemovePreferenceOption {
  static type = '[Preferences] Remove preference option';
  constructor(public option: string | string[]) { }
}

export class OpenSettings {
  static type = '[Preferences] Open settings';
}

export class OpenKeyboardShortcuts {
  static type = '[Preferences] Open keyboard shortcuts';
}