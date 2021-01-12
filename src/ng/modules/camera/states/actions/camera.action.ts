import { IPoint } from 'common/math';
import { CameraZoom } from 'ng/modules/toolbar/states/toolbar.interface';

export class ZoomCameraToPosition {
  static type = '[Camera] Zoom camera';
  constructor(public zoom: number, public target?: IPoint, public global = true) { }
}

export class ZoomCameraOut {
  static type = '[Camera] Zoom camera out';
  constructor(public entities: string[] = []) { }
}

export class MoveCameraToPosition {
  static type = '[Camera] Move camera to position';
  constructor(public position: IPoint, public global = true) { }
}

export class UpdateCameraZoom {
  static type = '[Camera] Update camera zoom';
  constructor(public zoom: Partial<CameraZoom>) { }
}

export class UpdateCameraPosition {
  static type = '[Camera] Update camera position';
  constructor(public position: IPoint) { }
}