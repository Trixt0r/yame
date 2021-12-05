import { Directive, Input, OnChanges, SimpleChanges, ViewContainerRef } from '@angular/core';
import { ISettingsOption } from '../interfaces/settings-option.interface';

@Directive({
  selector: '[yameSettingOption]',
})
export class SettingsOptionDirective implements OnChanges {
  @Input('yameSettingOption') settingsOption?: ISettingsOption;

  constructor(protected vcr: ViewContainerRef) {}

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.settingsOption) return;
    this.vcr.clear();
    if (!this.settingsOption) return;
    const comp = this.vcr.createComponent(this.settingsOption.component);
    comp.instance.option = this.settingsOption;
    comp.changeDetectorRef.markForCheck();
  }
}
