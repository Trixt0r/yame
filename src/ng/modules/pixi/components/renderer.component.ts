import { Component, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { CameraId } from 'ng/modules/camera';
import { ISceneRendererComponent } from 'ng/modules/scene';

@Component({
  template: `<canvas [yameCamera]="cameraId"></canvas>`,
  styles: [
    `
      canvas {
        cursor: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixiRendererComponent implements ISceneRendererComponent<HTMLCanvasElement> {
  readonly cameraId = CameraId.SCENE;
  constructor(public readonly ref: ElementRef<HTMLCanvasElement>) {}
}
