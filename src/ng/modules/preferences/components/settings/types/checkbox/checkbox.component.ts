import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
    templateUrl: 'checkbox.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SettingsCheckboxComponent extends SettingsAbstractComponent<boolean> {}
