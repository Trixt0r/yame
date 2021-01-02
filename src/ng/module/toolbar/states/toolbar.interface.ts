import { IPoint } from 'common/math';

export interface CameraZoom {
  /**
   * The zoom value.
   */
  value: number;

  /**
   * The minimum zoom value.
   */
  min: number;

  /**
   * The maximum zoom value.
   */
  max: number;

  /**
   * The step value for zooming in and out.
   */
  step: number;

  /**
   * The target position to zoom to.
   */
  target: IPoint;
}

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