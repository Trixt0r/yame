import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
  templateUrl: 'slider.component.html',
  styleUrls: ['../../../../../../styles/utils.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsSliderComponent extends SettingsAbstractComponent<number> {
}