import { Injectable } from '@angular/core';
import { Action, createSelector, NgxsOnInit, Select, Selector, State, StateContext } from '@ngxs/store';
import { sort } from 'common/sort';
import { uniqBy } from 'lodash';
import { Observable } from 'rxjs';
import { ISettingsOption } from '../interfaces/settings-option.interface';
import { ISettingsSection } from '../interfaces/settings-section.interface';
import {
  AddSettingsOption,
  AddSettingsSection,
  InitDefaultSettingsValue,
  RemoveSettingsOption,
  RemoveSettingsSection,
  SelectSettingsSection,
  UpdateSettingsValue,
} from './actions/settings.action';

export interface ISettingsValues {
  [id: string]: unknown;
}

export interface ISettingsState {
  /**
   * UI specific state.
   */
  ui: {
    currentSection?: string;
    sections: ISettingsSection[];
    options: ISettingsOption[];
  };

  /**
   * The actual settings values.
   */
  values: ISettingsValues;
}

@State<ISettingsState>({
  name: 'settings',
  defaults: {
    ui: {
      sections: [],
      options: [],
    },
    values: {},
  },
})
@Injectable()
export class SettingsState implements NgxsOnInit {
  public static readonly STORAGE_KEY = 'yameSettings';

  /**
   * Stream for subscribing to changes for a specific setting.
   * @param id The id of the setting.
   */
  static value(id: string) {
    return createSelector([this], (state: ISettingsState) => state.values[id]);
  }

  /**
   * Returns the settings sections.
   */
  @Selector()
  static sections(state: ISettingsState) {
    return state.ui.sections;
  }

  /**
   * Returns the (visual) settings options.
   */
  @Selector()
  static options(state: ISettingsState) {
    return state.ui.options;
  }

  /**
   * Returns the currently selected section.
   */
  @Selector()
  static currentSection(state: ISettingsState) {
    return state.ui.currentSection;
  }

  /**
   * Returns all settings values.
   */
  @Selector()
  static values(state: ISettingsState) {
    return state.values;
  }

  @Select(SettingsState.values) values$!: Observable<ISettingsValues>;

  /**
   * @inheritdoc
   */
  ngxsOnInit(ctx?: StateContext<ISettingsState>) {
    const state = ctx?.getState();
    try {
      const loadedSettings = localStorage.getItem(SettingsState.STORAGE_KEY);
      if (loadedSettings) ctx?.setState({ ui: state!.ui, values: JSON.parse(loadedSettings) });
    } catch (e) {
      console.warn('[SettingsState] Could not load settings state from local storage', e);
    }

    this.values$.subscribe((values) => {
      localStorage.setItem(SettingsState.STORAGE_KEY, JSON.stringify(values));
    });
  }

  @Action(AddSettingsSection)
  addSection(ctx: StateContext<ISettingsState>, action: AddSettingsSection) {
    const state = ctx.getState();
    const ui = state.ui;
    const currentSections = ui.sections.slice();
    const sections = uniqBy(Array.isArray(action.section) ? action.section : [action.section], (it) => it.id);
    const added: ISettingsSection[] = [];
    sections.forEach((it) => {
      const found = currentSections.find((opt) => opt.id === it.id);
      if (found) return console.warn(`[Settings] Section with id ${it.id} already exists`);
      added.push(it);
    });
    if (added.length === 0) return;
    ui.sections = sort(currentSections.concat(added));
    if (!ui.currentSection && ui.sections.length > 0) ui.currentSection = ui.sections[0].id;
    ctx.patchState({ ui });
  }

  @Action(RemoveSettingsSection)
  removeSection(ctx: StateContext<ISettingsState>, action: RemoveSettingsSection) {
    const state = ctx.getState();
    const ui = state.ui;
    const sections = ui.sections.slice();
    const toRemove = Array.isArray(action.section) ? action.section : [action.section];
    toRemove.forEach((it) => {
      const idx = sections.findIndex((opt) => opt.id === it);
      if (idx < 0) return console.warn(`[Settings] Section with id ${it} doesn't exist`);
      sections.splice(idx, 1);
    });
    console.log('remove');
    ui.sections = sections;
    ctx.patchState({ ui });
  }

  @Action(SelectSettingsSection)
  selectSection(ctx: StateContext<ISettingsState>, action: SelectSettingsSection) {
    const state = ctx.getState();
    const ui = Object.assign({}, state.ui, { currentSection: action.section });
    ctx.patchState({ ui });
  }

  @Action(AddSettingsOption)
  addOption(ctx: StateContext<ISettingsState>, action: AddSettingsOption) {
    const state = ctx.getState();
    const ui = state.ui;
    const currentOptions = ui.options.slice();
    const options = uniqBy(Array.isArray(action.option) ? action.option : [action.option], (it) => it.id);
    const added: ISettingsOption[] = [];
    options.forEach((it) => {
      const found = currentOptions.find((opt) => opt.id === it.id);
      if (found) return console.warn(`[Settings] Option with id ${it.id} already exists`);
      added.push(it);
    });
    if (added.length === 0) return;
    ui.options = sort(currentOptions.concat(added));
    ctx.patchState({ ui });
  }

  @Action(RemoveSettingsOption)
  removeOption(ctx: StateContext<ISettingsState>, action: RemoveSettingsOption) {
    const state = ctx.getState();
    const ui = state.ui;
    const options = ui.options.slice();
    const toRemove = Array.isArray(action.option) ? action.option : [action.option];
    toRemove.forEach((it) => {
      const idx = options.findIndex((opt) => opt.id === it);
      if (idx < 0) return console.warn(`[Settings] Option with id ${it} doesn't exist`);
      options.splice(idx, 1);
    });
    ui.options = options;
    ctx.patchState({ ui });
  }

  @Action(UpdateSettingsValue)
  updateValue(ctx: StateContext<ISettingsState>, action: UpdateSettingsValue<unknown>) {
    const state = ctx.getState();
    const values = Object.assign({}, state.values);
    values[action.id] = action.value;
    ctx.setState({ ui: state.ui, values });
  }

  @Action(InitDefaultSettingsValue)
  initDefaultValue(ctx: StateContext<ISettingsState>, action: InitDefaultSettingsValue<unknown>) {
    const state = ctx.getState();
    const values = { ...state.values };
    if (values[action.id] === void 0) {
      values[action.id] = action.value;
      ctx.setState({ ui: state.ui, values });
    }
  }
}
