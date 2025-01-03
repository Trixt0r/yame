import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
    templateUrl: 'number.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SettingsNumberComponent extends SettingsAbstractComponent<number> {
}