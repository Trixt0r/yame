import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ICameraState } from 'ng/modules/toolbar/states/toolbar.interface';
import { UpdateCameraZoom, UpdateCameraPosition } from './actions/camera.action';

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