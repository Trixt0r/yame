import { Injectable, NgZone } from '@angular/core';
import { Action, Select, Selector, State, StateContext, Store } from '@ngxs/store';
import { UpdateCameraZoom, UpdateCameraPosition } from './actions/camera.action';
import { IPoint } from 'common/math';
import { CameraZoom } from '../camera-zoom.interface';
import { SettingsState } from 'ng/modules/preferences/states/settings.state';
import { Observable } from 'rxjs';

export interface ICameraState {
  /**
   * The zoom settings.
   */
  zoom: CameraZoom;

  /**
   * The position of the camera.
   */
  position: IPoint;
}

@State<ICameraState>({
  name: 'camera',
  defaults: {
    zoom: {
      value: 1,
      min: 0.05,
      max: 3,
      step: 0.05,
      target: { x: 0, y: 0 }
    },
    position: { x: 0, y: 0 }
  }
})
@Injectable()
export class CameraState {

  /**
   * Returns the current zoom config.
   */
  @Selector()
  static zoom(state: ICameraState) { return state.zoom; }

  /**
   * Returns the current camera position.
   */
  @Selector()
  static position(state: ICameraState) { return state.position; }

  @Select(SettingsState.value('camera.zoomStep')) zoomStep$!: Observable<number>;
  @Select(SettingsState.value('camera.zoomMax')) zoomMax$!: Observable<number>;
  @Select(SettingsState.value('camera.zoomMin')) zoomMin$!: Observable<number>;

  constructor(store: Store, zone: NgZone) {
    zone.runOutsideAngular(() => {
      this.zoomStep$.subscribe(zoom => {
        store.dispatch(new UpdateCameraZoom({ step: typeof zoom === 'number' ? zoom : 0.05 }));
      });
      this.zoomMax$.subscribe(max => {
        store.dispatch(new UpdateCameraZoom({ max: typeof max === 'number' ? max : 3 }));
      });
      this.zoomMin$.subscribe(min => {
        store.dispatch(new UpdateCameraZoom({ min: typeof min === 'number' ? min : 0.05 }));
      });
    });
  }

  @Action(UpdateCameraZoom)
  updateZoom(ctx: StateContext<ICameraState>, action: UpdateCameraZoom) {
    const state = ctx.getState();
    const target = action.zoom?.target ?? state.zoom.target;
    const zoom = {
        value: action.zoom?.value ?? state.zoom.value,
        target: { x: target.x, y: target.y },
        min: action.zoom?.min ?? state.zoom.min,
        max: action.zoom?.max ?? state.zoom.max,
        step: action.zoom?.step ?? state.zoom.step,
    };
    ctx.patchState({ zoom });
  }

  @Action(UpdateCameraPosition)
  updatePosition(ctx: StateContext<ICameraState>, action: UpdateCameraPosition) {
    const state = ctx.getState();
    const position = action.position ?? state.position;
    ctx.patchState({ position: { x: position.x, y: position.y } });
  }

}