import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzMarks } from 'ng-zorro-antd/slider';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
    templateUrl: 'slider.component.html',
    styleUrls: ['../../../../../../styles/utils.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SettingsSliderComponent extends SettingsAbstractComponent<number> {
  /**
   * The ticks value.
   */
  get ticks(): NzMarks | null {
    const settings = this.option.componentSettings;
    if (!settings?.ticks) return null;
    if (typeof settings?.ticks === 'number') {
      const min = (settings.min as number) ?? 0;
      const max = (settings.max as number) ?? 100;
      const marks: NzMarks = {};
      for (let i = min; i <= max; i += settings?.ticks) marks[i] = String(i);
      return marks;
    }
    return settings?.ticks as NzMarks | null;
  }
}
