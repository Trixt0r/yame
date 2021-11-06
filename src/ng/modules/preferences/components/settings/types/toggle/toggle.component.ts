import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
  templateUrl: 'toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsToggleComponent extends SettingsAbstractComponent<boolean> {}
