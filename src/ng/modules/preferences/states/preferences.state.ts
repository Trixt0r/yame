import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { sort } from 'common/sort';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SettingsComponent } from '../components/settings/settings.component';
import { IPreferenceOption } from '../interfaces/preference-option.interface';
import { AddPreferenceOption, OpenSettings, RemovePreferenceOption } from './actions/preferences.action';

export interface IPreferencesState {
  options: IPreferenceOption[];
}

@State<IPreferencesState>({
  name: 'preferences',
  defaults: {
    options: [
      {
        id: 'settings',
        label: 'preferences.settings.title',
        icon: 'build',
        action: OpenSettings,
      },
    ],
  },
})
@Injectable()
export class PreferencesState {
  @Selector() static options(state: IPreferencesState) {
    return state.options;
  }

  constructor(private modal: NzModalService) {}

  @Action(AddPreferenceOption)
  addOption(ctx: StateContext<IPreferencesState>, action: AddPreferenceOption) {
    const currentOptions = ctx.getState().options.slice();
    const options = Array.isArray(action.option) ? action.option : [action.option];
    const added: IPreferenceOption[] = [];
    options.forEach((it) => {
      const found = currentOptions.find((opt) => opt.id === it.id);
      if (found) return console.warn(`[Preferences] Option with id ${it.id} already exists`);
      added.push(it);
    });
    if (added.length === 0) return;
    const newOptions = sort(currentOptions.concat(added));
    return ctx.patchState({ options: newOptions });
  }

  @Action(RemovePreferenceOption)
  removeOption(ctx: StateContext<IPreferencesState>, action: RemovePreferenceOption) {
    const options = ctx.getState().options.slice();
    const toRemove = Array.isArray(action.option) ? action.option : [action.option];
    toRemove.forEach((it) => {
      const idx = options.findIndex((opt) => opt.id === it);
      if (idx < 0) return console.warn(`[Preferences] Option with id ${it} doesn't exist`);
      options.splice(idx, 1);
    });
    return ctx.patchState({ options });
  }

  @Action(OpenSettings)
  openSettings() {
    this.modal.create({
      nzContent: SettingsComponent,
      nzStyle: {
        width: '100%',
        height: 'calc(100% - 60px)',
        top: '30px',
        padding: '30px',
        overflow: 'hidden',
      },
      nzBodyStyle: {
        width: '100%',
        height: '80vh',
      },
      nzFooter: null,
      nzCloseIcon: 'close',
      nzWidth: '100%',
    });
  }
}
