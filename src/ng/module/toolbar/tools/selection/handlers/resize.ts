import { Container } from "pixi.js";
import { ResizeAnchor, HOR, VERT, LEFT, UP, RIGHT, DOWN } from "./resize/anchor";
import { SelectionRenderer } from "../renderer";
import { SelectionContainer } from "../container";
import { Group, PixiService } from "ng/module/pixi/idx";

/**
 * The resize handler delegates all tasks to @see {ResizeAnchor}
 * and makes sure that all anchors are setup properly.
 *
 * @export
 * @class SelectionResizeHandler
 */
export class SelectionResizeHandler {

  /**
   * The list of anchor points.
   *
   * @type {ResizeAnchor[]}
   */
  public readonly anchors: ResizeAnchor[] = [ ];

  /**
   * Creates an instance of SelectionResizeHandler.
   * @param {SelectionContainer} container The selection container.
   * @param {SelectionRenderer} renderer The selection renderer.
   * @param {PixiService} service The pixi service.
   * @memberof SelectionResizeHandler
   */
  constructor(private container: SelectionContainer, renderer: SelectionRenderer, service: PixiService) {
    this.anchors.push(
      new ResizeAnchor(HOR | VERT | LEFT | UP, service), // top left
      new ResizeAnchor(VERT | UP, service), // top mid
      new ResizeAnchor(HOR | VERT | RIGHT | UP, service), // top right
      new ResizeAnchor(HOR | RIGHT, service), // right mid
      new ResizeAnchor(HOR | VERT | RIGHT | DOWN, service), // bot right
      new ResizeAnchor(VERT | DOWN, service), // bot mid
      new ResizeAnchor(HOR | VERT | LEFT | DOWN, service), // bot left
      new ResizeAnchor(HOR | LEFT, service), // left mid
    );

    renderer.on('attached', this.attached, this);
    renderer.on('detached', this.detached, this);
    renderer.on('updated', this.updated, this);
  }

  /**
   * Determines whether the resizing can be active or not.
   *
   * @readonly
   * @type {boolean}
   */
  get canBeActive(): boolean {
    return this.container.length === 1 && !(this.container.entities[0] instanceof Group);
  }

  /**
   * Attaches handler.
   * Executed when the selection renderer got attached to the stage.
   *
   * @param {Container} stage
   * @returns {void}
   * @memberof SelectionResizeHandler
   */
  attached(stage: Container): void {
    if (!this.canBeActive) return;
    this.anchors.forEach(anchor => {
      anchor.render();
      anchor.container = this.container;
      anchor.target = this.container.entities[0];
      anchor.on('update', () => this.container.emit('update'))
            .on('handle:start', () => this.container.beginHandling(anchor))
            .on('handle:end', () => this.container.endHandling(anchor));
      stage.addChild(anchor);
    });
  }

  /**
   * Detached handler.
   * Executed when the selection renderer gets removed from the stage.
   *
   * @param {Container} stage
   * @returns {void}
   */
  detached(stage: Container): void {
    this.anchors.forEach(anchor => {
      anchor.container = null;
      anchor.target = null;
      anchor.off('update').off('handle:start').off('handle:end');
      stage.removeChild(anchor);
    });
  }

  /**
   * Update handler.
   * Executed when the selection container got updated.
   *
   * @param {Container} stage
   * @returns {void}
   */
  updated(stage: Container): void {
    if (!this.canBeActive) return;
    const bnds = this.container.getLocalBounds();
    this.anchors.forEach(anchor => anchor.update(stage, bnds));
  }

}
