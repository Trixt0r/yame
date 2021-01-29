import { ISettingsOption } from '../../interfaces/settings-option.interface';
import { ISettingsSection } from '../../interfaces/settings-section.interface';

export class AddSettingsSection {
  static type = '[Settings] Add settings section';
  constructor(public section: ISettingsSection | ISettingsSection[]) { }
}

export class RemoveSettingsSection {
  static type = '[Settings] Remove settings section';
  constructor(public section: string | string[]) { }
}

export class SelectSettingsSection {
  static type = '[Settings] Select settings section';
  constructor(public section: string) { }
}

export class AddSettingsOption {
  static type = '[Settings] Add settings option';
  constructor(public option: ISettingsOption | ISettingsOption[]) { }
}

export class RemoveSettingsOption {
  static type = '[Settings] Remove settings option';
  constructor(public option: string | string[]) { }
}

export class UpdateSettingsValue<T> {
  static type = '[Settings] Update settings value';
  constructor(public id: string, public value: T) { }
}