import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
    templateUrl: 'input.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SettingsInputComponent extends SettingsAbstractComponent<string> {

}