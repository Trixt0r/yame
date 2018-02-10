import { PixiComponent } from '../module/pixi/component';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { WorkspaceComponent } from "../module/workspace/component";
import { PixiCameraDirective } from 'ng/module/pixi/directive/camera';
import { PixiGridDirective } from 'ng/module/pixi/directive/grid';

@Component({
  moduleId: module.id,
  selector: 'main',
  templateUrl: 'main.html',
  styleUrls: ['./main.scss']
})
export class MainComponent implements AfterViewInit {

  @ViewChild('pixi') pixi: PixiComponent;
  @ViewChild('workspace') workspace: WorkspaceComponent;
  @ViewChild(PixiCameraDirective) pixiCamera: PixiCameraDirective;
  @ViewChild(PixiGridDirective) pixiGrid: PixiGridDirective;

  constructor(public ref: ElementRef) {
  }

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
    this.pixi.ref.nativeElement.style['height'] = `${top}px`;
    this.pixiGrid.update();
    this.pixi.onResize();
  }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.pixiGrid.listenToCamera(this.pixiCamera.camera);
  }

}
