import { Tool, ToolType } from '../toolbar/tool';
import { PreferencesMenuComponent } from './components/menu/menu.component';

export class PreferencesTool extends Tool {

  /**
   * @inheritdoc
   */
  readonly type = ToolType.CLICK;

  /**
   * @inheritdoc
   */
  readonly component = PreferencesMenuComponent;

  constructor() {
    super('preferences', 'settings', 0);
  }
}