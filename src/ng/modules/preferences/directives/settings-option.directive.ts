import { ComponentFactoryResolver, Directive, Input, OnChanges, SimpleChanges, Type, ViewContainerRef } from '@angular/core';
import { ISettingsOption } from '../interfaces/settings-option.interface';

@Directive({
  selector: '[yameSettingOption]'
})
export class SettingsOptionDirective implements OnChanges {

  @Input('yameSettingOption') settingsOption?: ISettingsOption;

  constructor(protected vcr: ViewContainerRef, protected cfr: ComponentFactoryResolver) { }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.settingsOption) return;
    this.vcr.clear();
    if (!this.settingsOption) return;
    const factory = this.cfr.resolveComponentFactory(this.settingsOption.component);
    const comp = this.vcr.createComponent(factory);
    comp.instance.option = this.settingsOption;
    comp.changeDetectorRef.markForCheck();
  }

}