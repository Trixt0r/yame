import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxsModule, Store } from '@ngxs/store';
import { RegisterTool } from '../toolbar/states/actions/toolbar.action';
import { UtilsModule } from '../utils';
import { PreferencesMenuComponent } from './components/menu/menu.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsCheckboxComponent } from './components/settings/types/checkbox/checkbox.component';
import { SettingsInputComponent } from './components/settings/types/input/input.component';
import { SettingsNumberComponent } from './components/settings/types/number/number.component';
import { SettingsSelectionComponent } from './components/settings/types/selection/selection.component';
import { SettingsSliderComponent } from './components/settings/types/slider/slider.component';
import { SettingsToggleComponent } from './components/settings/types/toggle/toggle.component';
import { SettingsOptionDirective } from './directives/settings-option.directive';
import { PreferencesTool } from './preferences.tool';
import { AddSettingsOption, AddSettingsSection } from './states/actions/settings.action';
import { PreferencesState } from './states/preferences.state';
import { SettingsState } from './states/settings.state';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSliderModule } from 'ng-zorro-antd/slider';

@NgModule({
  imports: [
    CommonModule,
    UtilsModule,
    FormsModule,
    NzModalModule,
    NzCardModule,
    NzIconModule,
    NzMenuModule,
    NzListModule,
    NzSelectModule,
    NzCheckboxModule,
    NzSwitchModule,
    NzInputModule,
    NzSliderModule,
    NgxsModule.forFeature([PreferencesState, SettingsState]),
  ],
  declarations: [
    PreferencesMenuComponent,
    SettingsComponent,
    SettingsCheckboxComponent,
    SettingsInputComponent,
    SettingsNumberComponent,
    SettingsSelectionComponent,
    SettingsSliderComponent,
    SettingsToggleComponent,
    SettingsOptionDirective,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => () => {
        store.dispatch(new RegisterTool(new PreferencesTool()));
        store.dispatch([
          new AddSettingsSection([
            { id: 'general', label: 'preferences.settings.section.general', icon: 'home', position: 0 },
          ]),
          new AddSettingsOption([
            {
              id: 'autoSave',
              label: 'preferences.settings.option.autoSave',
              component: SettingsToggleComponent,
              section: 'general',
            },
            {
              section: 'general',
              id: 'language',
              label: 'preferences.settings.section.language',
              component: SettingsSelectionComponent,
              componentSettings: {
                options: [
                  { value: 'en', label: 'English' },
                  { value: 'de', label: 'Deutsch' },
                ],
              },
            },
          ]),
        ]);
      },
      deps: [Store],
      multi: true,
    },
  ],
})
export class PreferencesModule {}
