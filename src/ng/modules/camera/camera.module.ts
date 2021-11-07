import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxsModule, Store } from '@ngxs/store';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { SettingsSelectionComponent } from '../preferences/components/settings/types/selection/selection.component';
import {
  AddSettingsOption,
  AddSettingsSection,
  InitDefaultSettingsValue,
} from '../preferences/states/actions/settings.action';
import { RegisterTool } from '../toolbar/states/actions/toolbar.action';
import { CameraTool } from './camera.tool';
import { CameraToolComponent } from './components/tool/tool.component';
import { CameraState } from './states/camera.state';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    FormsModule,
    NzCardModule,
    NzSliderModule,
    NzButtonModule,
    NzIconModule,
    NgxsModule.forFeature([CameraState]),
  ],
  declarations: [CameraToolComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, cameraTool: CameraTool) => () => {
        store.dispatch([
          new RegisterTool(cameraTool),
          new InitDefaultSettingsValue('camera.moveType', 1),
          new InitDefaultSettingsValue('camera.zoomStep', 0.05),
          new InitDefaultSettingsValue('camera.zoomMax', 3),
          new InitDefaultSettingsValue('camera.zoomMin', 0.05),
          new AddSettingsSection({
            id: 'camera',
            label: 'preferences.settings.section.camera',
            icon: 'video-camera',
            position: 1,
          }),
          new AddSettingsOption([
            {
              section: 'camera',
              id: 'camera.moveType',
              label: 'preferences.settings.option.camera.moveType',
              component: SettingsSelectionComponent,
              componentSettings: {
                options: [
                  { value: 1, label: 'preferences.settings.option.camera.moveTypeOptions.mmb', icon: 'fa:mouse-solid' },
                  { value: 2, label: 'preferences.settings.option.camera.moveTypeOptions.rmb', icon: 'fa:mouse-solid' },
                  {
                    value: -1,
                    label: 'preferences.settings.option.camera.moveTypeOptions.trackpad',
                    icon: 'fa:touchpad',
                  },
                ],
              },
            },
            {
              section: 'camera',
              id: 'camera.zoomStep',
              label: 'preferences.settings.option.camera.zoomStep',
              component: SettingsSelectionComponent,
              componentSettings: {
                options: [
                  { value: 0.01, label: '1%' },
                  { value: 0.02, label: '2%' },
                  { value: 0.03, label: '3%' },
                  { value: 0.04, label: '4%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.075, label: '7.5%' },
                  { value: 0.1, label: '10%' },
                  { value: 0.125, label: '12.5%' },
                  { value: 0.15, label: '15%' },
                  { value: 0.175, label: '17.5%' },
                  { value: 0.2, label: '20%' },
                  { value: 0.225, label: '22.5%' },
                  { value: 0.25, label: '25%' },
                ],
              },
            },
            {
              section: 'camera',
              id: 'camera.zoomMax',
              label: 'preferences.settings.option.camera.zoomMax',
              component: SettingsSelectionComponent,
              componentSettings: {
                options: [
                  { value: 1.5, label: '150%' },
                  { value: 2, label: '200%' },
                  { value: 2.5, label: '250%' },
                  { value: 3, label: '300%' },
                  { value: 3.5, label: '350%' },
                  { value: 4, label: '400%' },
                  { value: 4.5, label: '450%' },
                  { value: 5, label: '500%' },
                ],
              },
            },
            {
              section: 'camera',
              id: 'camera.zoomMin',
              label: 'preferences.settings.option.camera.zoomMin',
              component: SettingsSelectionComponent,
              componentSettings: {
                options: [
                  { value: 0.01, label: '1%' },
                  { value: 0.02, label: '2%' },
                  { value: 0.03, label: '3%' },
                  { value: 0.04, label: '4%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.1, label: '10%' },
                  { value: 0.15, label: '15%' },
                  { value: 0.25, label: '25%' },
                  { value: 0.5, label: '50%' },
                ],
              },
            },
          ]),
        ]);
      },
      deps: [Store, CameraTool],
      multi: true,
    },
  ],
})
export class CameraModule {}
