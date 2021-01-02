import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Tool, IToolComponent } from '../../../../toolbar/tool';

/**
 * The default tool component displays the icon of the tool,
 */
@Component({
  template: `
    <mat-icon mat-list-icon>{{ tool.icon ? tool.icon : 'build' }}</mat-icon>
  `,
  styles: [
    `
      mat-icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultToolComponent implements IToolComponent {

  /**
   * @inheritdoc
   */
  tool!: Tool;
}
