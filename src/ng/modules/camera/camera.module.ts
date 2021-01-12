import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxsModule, Store } from '@ngxs/store';
import { MaterialModule } from '../material.module';
import { RegisterTool } from '../toolbar/states/actions/toolbar.action';
import { CameraTool } from './camera.tool';
import { CameraToolComponent } from './components/tool/tool.component';
import { CameraState } from './states/camera.state';

@NgModule({
  imports: [CommonModule, MaterialModule, OverlayModule, FormsModule, NgxsModule.forFeature([CameraState])],
  declarations: [CameraToolComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, cameraTool: CameraTool) => () => {
        store.dispatch(new RegisterTool(cameraTool));
      },
      deps: [
        Store,
        CameraTool
      ],
      multi: true,
    },
  ],
})
export class CameraModule { }