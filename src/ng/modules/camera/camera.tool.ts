import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { ShowToolbarOptions } from '../toolbar/states/actions/toolbar.action';
import { Tool, ToolType } from '../toolbar/tool';
import { CameraToolComponent } from './components/tool/tool.component';

@Injectable({ providedIn: 'root' })
export class CameraTool extends Tool {

  /**
   * @inheritdoc
   */
  type = ToolType.CLICK;

  constructor(public store: Store) {
    super('camera', 'videocam');
  }

  /**
   * @inheritdoc
   */
  async onActivate(event?: MouseEvent): Promise<void> {
    await this.store.dispatch(new ShowToolbarOptions(CameraToolComponent, event?.currentTarget as Element)).toPromise();
  }
}