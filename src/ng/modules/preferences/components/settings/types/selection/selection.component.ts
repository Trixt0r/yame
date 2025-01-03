import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsAbstractComponent } from '../abstract.component';

@Component({
    templateUrl: 'selection.component.html',
    styleUrls: ['../../../../../../styles/utils.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SettingsSelectionComponent extends SettingsAbstractComponent<string> {

  public currentOption?: string & { id?: string; value: string; label?: string; icon?: string; };

  protected updateCurrentOptions(val: string) {
    const options = this.option.componentSettings?.options;

    if (Array.isArray(options))
      this.currentOption = options.find(it => it === val || it.value === val);
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit() {
    this.beforeChangeDetection$.subscribe(() => this.updateCurrentOptions(this.value));
    super.ngAfterViewInit();
  }
}