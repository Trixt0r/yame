import { Injectable, NgZone, Type } from '@angular/core';
import { Action, createSelector, Select, State, StateContext, Store } from '@ngxs/store';
import { UpdateCameraZoom, UpdateCameraPosition } from './actions/camera.action';
import { IPoint } from 'common/math';
import { CameraZoom } from '../camera-zoom.interface';
import { SettingsState } from 'ng/modules/preferences/states/settings.state';
import { Observable } from 'rxjs';
import { cloneDeep } from 'lodash';
import { CameraId } from '../camera.ids';

export interface ICamera {
  /**
   * The camera id.
   */
  id: string;

  /**
   * The zoom settings.
   */
  zoom: CameraZoom;

  /**
   * The position of the camera.
   */
  position: IPoint;
}

export type ICameraState = {
  cameras: ICamera[];
};

const DEFAULT_ID = CameraId.SCENE;
const DEFAULT_CAMERA: ICamera = {
  id: DEFAULT_ID,
  zoom: {
    value: 1,
    min: 0.05,
    max: 3,
    step: 0.05,
    target: { x: 0, y: 0 },
  },
  position: { x: 0, y: 0 },
};

@State<ICameraState>({
  name: 'camera',
  defaults: {
    cameras: [cloneDeep(DEFAULT_CAMERA)],
  },
})
@Injectable()
export class CameraState {
  /**
   * Returns the current zoom config.
   */
  static zoom(id: string) {
    return createSelector(
      [this],
      (state: ICameraState) => state.cameras.find(_ => _.id === id)?.zoom ?? { ...DEFAULT_CAMERA.zoom }
    );
  }

  /**
   * Returns the current camera position.
   */
  static position(id: string) {
    return createSelector(
      [this],
      (state: ICameraState) => state.cameras.find(_ => _.id === id)?.position ?? { ...DEFAULT_CAMERA.position }
    );
  }

  @Select(SettingsState.value('camera.zoomStep')) zoomStep$!: Observable<number>;
  @Select(SettingsState.value('camera.zoomMax')) zoomMax$!: Observable<number>;
  @Select(SettingsState.value('camera.zoomMin')) zoomMin$!: Observable<number>;

  constructor(private store: Store, zone: NgZone) {
    zone.runOutsideAngular(() => {
      this.zoomStep$.subscribe(zoom => {
        this.updateSettings(UpdateCameraZoom, { step: typeof zoom === 'number' ? zoom : 0.05 });
      });
      this.zoomMax$.subscribe(max => {
        this.updateSettings(UpdateCameraZoom, { max: typeof max === 'number' ? max : 3 });
      });
      this.zoomMin$.subscribe(min => {
        this.updateSettings(UpdateCameraZoom, { min: typeof min === 'number' ? min : 0.05 });
      });
    });
  }

  /**
   * Updates the camera settings for all registered cameras.
   *
   * @param clazz The type to create the instance for.
   * @param args The argument to pass to the constructor of the given type
   */
  private updateSettings<T>(clazz: Type<T>, ...args: unknown[]): void {
    const state = this.store.selectSnapshot(_ => _.camera) as ICameraState;
    if (!state) return;
    const actions = state.cameras.map(_ => new clazz(_.id, ...args));
    this.store.dispatch(actions);
  }

  private ensureCamera(id: string, state: ICameraState): ICamera {
    let found = state.cameras.find(_ => _.id === id);
    if (!found) {
      found = { ...cloneDeep(DEFAULT_CAMERA), id };
      state.cameras.push(found);
    }
    return found;
  }

  @Action(UpdateCameraZoom)
  updateZoom(ctx: StateContext<ICameraState>, action: UpdateCameraZoom) {
    const state = ctx.getState();
    let cam = this.ensureCamera(action.id, state);
    const target = action.zoom?.target ?? cam.zoom.target;
    cam.zoom = {
      value: action.zoom?.value ?? cam.zoom.value,
      target: { x: target.x, y: target.y },
      min: action.zoom?.min ?? cam.zoom.min,
      max: action.zoom?.max ?? cam.zoom.max,
      step: action.zoom?.step ?? cam.zoom.step,
    };
    cam.zoom.value = Math.max(cam.zoom.min, Math.min(cam.zoom.max, cam.zoom.value));
    ctx.patchState({ cameras: state.cameras });
  }

  @Action(UpdateCameraPosition)
  updatePosition(ctx: StateContext<ICameraState>, action: UpdateCameraPosition) {
    const state = ctx.getState();
    let cam = this.ensureCamera(action.id, state);
    if (action.position.x === cam.position.x && action.position.y === cam.position.y) return;
    cam.position = { ...(action.position ?? cam.position) };
    ctx.patchState({ cameras: state.cameras });
  }
}
