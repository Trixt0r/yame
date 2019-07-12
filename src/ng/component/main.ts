import { PixiComponent } from '../module/pixi/component';
import { AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceComponent } from '../module/workspace/component';
import { PixiCameraDirective } from 'ng/module/pixi/directive/camera';
import { PixiGridDirective } from 'ng/module/pixi/directive/grid';
import { ToolbarComponent } from '../module/toolbar/component';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-main',
  templateUrl: 'main.html',
  styleUrls: ['./main.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  @ViewChild('pixi', { static: false }) pixi: PixiComponent;
  @ViewChild('toolbar', { static: false }) toolbar: ToolbarComponent;
  @ViewChild('workspace', { static: false }) workspace: WorkspaceComponent;
  @ViewChild(PixiCameraDirective, { static: false }) pixiCamera: PixiCameraDirective;
  @ViewChild(PixiGridDirective, { static: false }) pixiGrid: PixiGridDirective;

  constructor(public ref: ElementRef) {}

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.ref.nativeElement.style.width = `${left}px`;
    this.pixi.ref.nativeElement.width = `${left}px`;
    this.pixi.onResize();
    this.workspace.onResize();
  }

  /**
   * Handles the size update event of the workspace.
   * @param {number} top The top value of the workspace.
   * @returns {void}
   */
  sizeUpdated(top: number): void {
    if (this.pixi)
      this.pixi.ref.nativeElement.style['height'] = `${top}px`;
    if (this.toolbar)
      this.toolbar.ref.nativeElement.style['height'] = `${top}px`;
    if (this.pixiGrid)
      this.pixiGrid.update();
    if (this.pixi)
      this.pixi.onResize();
  }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.pixiGrid.listenToCamera(this.pixiCamera.camera);
  }
}
