import { IPoint } from 'common/math';
import { CameraZoom } from '../../camera-zoom.interface';

export class ZoomCameraOut {
  static type = '[Camera] Zoom camera out';
  constructor(public id: string, public entities: string[] = []) {}
}

export class UpdateCameraZoom {
  static type = '[Camera] Update camera zoom';
  constructor(public id: string, public zoom: Partial<CameraZoom>) {}
}

export class UpdateCameraPosition {
  static type = '[Camera] Update camera position';
  constructor(public id: string, public position: IPoint) {}
}
