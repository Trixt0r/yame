import { Container } from 'pixi.js';
import { ResizeAnchor, HOR, VERT, LEFT, UP, RIGHT, DOWN } from './resize/anchor';
import { Injectable, Inject } from '@angular/core';
import { PixiSelectionContainerService } from '../container.service';
import { PixiSelectionRendererService } from '../renderer.service';
import { PixiRendererService } from '../../renderer.service';
import { YAME_RENDERER } from 'ng/module/scene';
import { Subscription } from 'rxjs';
import { CursorService } from 'ng/services/cursor.service';

/**
 * The resize handler delegates all tasks to @see {ResizeAnchor}
 * and makes sure that all anchors are setup properly.
 */
@Injectable({ providedIn: 'root' })
export class PixiSelectionHandlerResizeService {
  /**
   * The list of anchor points.
   */
  public readonly anchors: readonly ResizeAnchor[] = [];

  /**
   * The update entity subscription, for updates via sidebar.
   */
  protected updateSub: Subscription;

  /**
   * Creates an instance of SelectionResizeHandler.
   */
  constructor(private containerService: PixiSelectionContainerService,
              protected renderer: PixiSelectionRendererService,
              @Inject(YAME_RENDERER) protected service: PixiRendererService,
              protected cursorService: CursorService) {
    this.anchors = [
      new ResizeAnchor(HOR | VERT | LEFT | UP, service, cursorService), // top left
      new ResizeAnchor(VERT | UP, service, cursorService), // top mid
      new ResizeAnchor(HOR | VERT | RIGHT | UP, service, cursorService), // top right
      new ResizeAnchor(HOR | RIGHT, service, cursorService), // right mid
      new ResizeAnchor(HOR | VERT | RIGHT | DOWN, service, cursorService), // bot right
      new ResizeAnchor(VERT | DOWN, service, cursorService), // bot mid
      new ResizeAnchor(HOR | VERT | LEFT | DOWN, service, cursorService), // bot left
      new ResizeAnchor(HOR | LEFT, service, cursorService) // left mid
    ];

    renderer.attached$.subscribe(() => this.attached());
    renderer.detached$.subscribe(() => this.detached());
    renderer.update$.subscribe(() => this.updated());
  }

  /**
   * Clears the update sub.
   */
  protected clearSub(): void {
    if (!this.updateSub) return;
    this.updateSub.unsubscribe();
    this.updateSub = null;
  }

  /**
   * Handles the attachment of the renderer to the stage.
   * Executed when the selection renderer got attached to the stage.
   */
  attached(): void {
    this.anchors.forEach(anchor => {
      anchor.drawData();
      anchor.containerService = this.containerService;
      anchor.target = this.containerService.container;
      anchor
        .on('updated', () => {
          this.containerService.dispatchUpdate(
            this.containerService.components.byId('transformation.position'),
            this.containerService.components.byId('transformation.scale'),
            this.containerService.components.byId('transformation.size')
          );
        })
        .on('handle:start', () => this.containerService.beginHandling(anchor))
        .on('handle:end', () => this.containerService.endHandling(anchor));
      (this.service.stage.getChildByName('foreground') as Container).addChild(anchor);
    });
    this.clearSub();
  }

  /**
   * Handles the detachment of the renderer from the stage.
   * Executed when the selection renderer gets removed from the stage.
   */
  detached(): void {
    this.clearSub();
    this.anchors.forEach(anchor => {
      anchor.containerService = null;
      anchor.target = null;
      anchor
        .off('updated')
        .off('handle:start')
        .off('handle:end');
      (this.service.stage.getChildByName('foreground') as Container).removeChild(anchor);
    });
  }

  /**
   * Update handler.
   * Executed when the selection container got updated.
   */
  updated(): void {
    const bnds = this.containerService.container.getLocalBounds();
    this.anchors.forEach(anchor => anchor.update(bnds));
  }
}
