import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { sort } from 'common/sort';
import { uniqBy } from 'lodash';
import { ISettingsOption } from '../interfaces/settings-option.interface';
import { ISettingsSection } from '../interfaces/settings-section.interface';
import { AddSettingsOption, AddSettingsSection, RemoveSettingsOption, RemoveSettingsSection, SelectSettingsSection, UpdateSettingsValue } from './actions/settings.action';

export interface ISettingsValues {
  [id: string]: unknown;
}

export interface ISettingsState {

  ui: {
    currentSection?: string;
    sections: ISettingsSection[];
    options: ISettingsOption[];
  },

  values: ISettingsValues;

}

@State<ISettingsState>({
  name: 'settings',
  defaults: {
    ui: {
      sections: [],
      options: []
    },
    values: { }
  }
})
@Injectable()
export class SettingsState {

  static value(id: string) {
    return createSelector([this], (state: ISettingsState) => state.values[id]);
  }

  @Selector() static sections(state: ISettingsState) { return state.ui.sections; }
  @Selector() static options(state: ISettingsState) { return state.ui.options; }
  @Selector() static currentSection(state: ISettingsState) { return state.ui.currentSection; }
  @Selector() static values(state: ISettingsState) { return state.values; }

  @Action(AddSettingsSection)
  addSection(ctx: StateContext<ISettingsState>, action: AddSettingsSection) {
    const state = ctx.getState();
    const ui = state.ui;
    const currentSections = ui.sections.slice();
    const sections = uniqBy(Array.isArray(action.section) ? action.section : [action.section], it => it.id);
    const added: ISettingsSection[] = [];
    sections.forEach(it => {
      const found = currentSections.find(opt => opt.id === it.id);
      if (found) return console.warn(`[Settings] Section with id ${it.id} already exists`);
      added.push(it);
    });
    if (added.length === 0) return;
    ui.sections = sort(currentSections.concat(added));
    if (!ui.currentSection && ui.sections.length > 0) ui.currentSection = ui.sections[0].id;
    return ctx.patchState({ ui });
  }

  @Action(RemoveSettingsSection)
  removeSection(ctx: StateContext<ISettingsState>, action: RemoveSettingsSection) {
    const state = ctx.getState();
    const ui = state.ui;
    const sections = ui.sections.slice();
    const toRemove = Array.isArray(action.section) ? action.section : [action.section];
    toRemove.forEach(it => {
      const idx = sections.findIndex(opt => opt.id === it);
      if (idx < 0) return console.warn(`[Settings] Section with id ${it} doesn't exist`);
      sections.splice(idx, 1);
    });
    console.log('remove');
    ui.sections = sections;
    return ctx.patchState({ ui });
  }

  @Action(SelectSettingsSection)
  selectSection(ctx: StateContext<ISettingsState>, action: SelectSettingsSection) {
    const state = ctx.getState();
    const ui = Object.assign({ }, state.ui, { currentSection: action.section });
    ctx.patchState({ ui });
  }

  @Action(AddSettingsOption)
  addOption(ctx: StateContext<ISettingsState>, action: AddSettingsOption) {
    const state = ctx.getState();
    const ui = state.ui;
    const currentOptions = ui.options.slice();
    const options = uniqBy(Array.isArray(action.option) ? action.option : [action.option], it => it.id);
    const added: ISettingsOption[] = [];
    options.forEach(it => {
      const found = currentOptions.find(opt => opt.id === it.id);
      if (found) return console.warn(`[Settings] Option with id ${it.id} already exists`);
      added.push(it);
    });
    if (added.length === 0) return;
    ui.options = sort(currentOptions.concat(added));
    return ctx.patchState({ ui });
  }

  @Action(RemoveSettingsOption)
  removeOption(ctx: StateContext<ISettingsState>, action: RemoveSettingsOption) {
    const state = ctx.getState();
    const ui = state.ui;
    const options = ui.options.slice();
    const toRemove = Array.isArray(action.option) ? action.option : [action.option];
    toRemove.forEach(it => {
      const idx = options.findIndex(opt => opt.id === it);
      if (idx < 0) return console.warn(`[Settings] Option with id ${it} doesn't exist`);
      options.splice(idx, 1);
    });
    ui.options = options;
    return ctx.patchState({ ui });
  }

  @Action(UpdateSettingsValue)
  updateValue(ctx: StateContext<ISettingsState>, action: UpdateSettingsValue<unknown>) {
    const state = ctx.getState();
    const values = Object.assign({}, state.values);
    values[action.id] = action.value;
    return ctx.setState({ ui: state.ui, values });
  }
}