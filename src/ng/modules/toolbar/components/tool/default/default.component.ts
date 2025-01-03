import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Tool, IToolComponent } from '../../../../toolbar/tool';

/**
 * The default tool component displays the icon of the tool,
 */
@Component({
    template: ` <i nz-icon [nzType]="tool.icon ? tool.icon : 'build'"></i> `,
    styles: [
        `
      i[nz-icon] {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 18px;
      }
    `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DefaultToolComponent implements IToolComponent {
  /**
   * @inheritdoc
   */
  tool!: Tool;
}
