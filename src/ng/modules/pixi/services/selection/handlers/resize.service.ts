import { Container } from 'pixi.js';
import { ResizeAnchor, HOR, VERT, LEFT, UP, RIGHT, DOWN } from './resize/anchor';
import { Injectable, Inject } from '@angular/core';
import { PixiSelectionContainerService } from '../container.service';
import { PixiSelectionRendererService } from '../renderer.service';
import { PixiRendererService } from '../../renderer.service';
import { YAME_RENDERER } from 'ng/modules/scene';
import { CursorService } from 'ng/services/cursor.service';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { Keydown, Keyup } from 'ng/states/hotkey.state';
import { PointSceneComponent } from 'common/scene';
import { SizeSceneComponent } from 'common/scene/component/size';

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
   * Creates an instance of SelectionResizeHandler.
   */
  constructor(private containerService: PixiSelectionContainerService,
              protected renderer: PixiSelectionRendererService,
              @Inject(YAME_RENDERER) protected service: PixiRendererService,
              protected cursorService: CursorService,
              protected actions: Actions) {
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
   * Handles keydown events `left`, `right`, `up` and `down`.
   *
   * @param data Additional data information such as the triggered event and the size values.
   */
  keydown(data: { event: KeyboardEvent; width?: number; height?: number }): void {
    if (this.containerService.currentHandler !== this) {
      if (this.containerService.isHandling)
        this.containerService.endHandling(this.containerService.currentHandler, data.event);
      this.containerService.beginHandling(this, data.event);
    }
    if (typeof data.width === 'number') this.containerService.container.width = data.width;
    if (typeof data.height === 'number') this.containerService.container.height = data.height;
    this.containerService.dispatchUpdate(
      this.containerService.components.byId('transformation.scale') as PointSceneComponent,
      this.containerService.components.byId('transformation.size') as SizeSceneComponent
    );
  }

  /**
   * Handles keyup events `left`, `right`, `up` and `down`.`
   *
   * @param event The triggered event.
   */
  keyup(event: KeyboardEvent) {
    if (this.containerService.currentHandler !== this) return;
    this.containerService.endHandling(this, event);
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
            this.containerService.components.byId('transformation.position') as PointSceneComponent,
            this.containerService.components.byId('transformation.scale') as PointSceneComponent,
            this.containerService.components.byId('transformation.size') as SizeSceneComponent
          );
        })
        .on('handle:start', () => this.containerService.beginHandling(anchor))
        .on('handle:end', () => this.containerService.endHandling(anchor));
      (this.service.stage?.getChildByName('foreground') as Container).addChild(anchor);
    });

    this.actions.pipe(ofActionSuccessful(Keydown), takeUntil(this.renderer.detached$))
                .subscribe((action: Keydown) => {
                  if (action.shortcut.id !== 'selection.resize') return;
                  const width = this.containerService.container.width;
                  const height = this.containerService.container.height;
                  switch (action.event.key.toLowerCase()) {
                    case 'arrowleft': this.keydown({ event: action.event, width: width - 1 }); break;
                    case 'arrowright': this.keydown({ event: action.event, width: width + 1 }); break;
                    case 'arrowup': this.keydown({ event: action.event, height: height + 1 }); break;
                    case 'arrowdown': this.keydown({ event: action.event, height: height - 1 }); break;
                  }
                });

    this.actions.pipe(ofActionSuccessful(Keyup), takeUntil(this.renderer.detached$))
                .subscribe((action: Keyup) => {
                  if (action.shortcut.id !== 'selection.resize') return;
                  this.keyup(action.event);
                });
  }

  /**
   * Handles the detachment of the renderer from the stage.
   * Executed when the selection renderer gets removed from the stage.
   */
  detached(): void {
    this.anchors.forEach(anchor => {
      anchor.containerService = null;
      anchor.target = null;
      anchor
        .off('updated')
        .off('handle:start')
        .off('handle:end');
      (this.service.stage?.getChildByName('foreground') as Container).removeChild(anchor);
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
