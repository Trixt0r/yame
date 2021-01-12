import { Component, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { ISceneRendererComponent } from 'ng/modules/scene';


@Component({
  template: `<canvas></canvas>`,
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
  constructor(public readonly ref: ElementRef<HTMLCanvasElement>) {}
}
