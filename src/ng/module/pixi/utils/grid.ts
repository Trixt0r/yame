import EventEmitter from 'common/event-emitter';
import { SCALE_MODES, Texture, Point, Sprite, ParticleContainer, Container, BaseTexture } from 'pixi.js';

/**
 * Class for rendering a grid in a specific 2D container.
 */
export class Grid extends EventEmitter {
  /**
   * Internal texture for the rectangles.
   * NOTE: The grid texture consists of 16x16 rectangles.
   */
  private static spriteTexture: Texture;

  /**
   * Amount of rectangles on each axis
   */
  private static rectangleCount: Point = new Point();

  /**
   * The grid width.
   */
  private pWidth: number;

  /**
   * Grid height.
   */
  private pHeight: number;

  /**
   * The container this grid is attached to.
   */
  private pContainer!: Container;

  /**
   * The last update size.
   */
  private lastUpdateSize: Point;

  /**
   * The last update position.
   */
  private lastUpdatePosition: Point;

  /**
   * Container for rendering the grid.
   */
  private gridContainer: Container;

  /**
   * Whether the cache is growing.
   */
  private growingCache!: boolean;

  /**
   * Internal cache of sprites.
   */
  private cache: Sprite[];

  /**
   * Whether the grid is ready.
   *
   * It gets ready, when the grid sprite got loaded.
   */
  private _ready: boolean;

  /**
   * The grid texture.
   */
  public static getGridTexture(): Texture {
    if (Grid.spriteTexture) return Grid.spriteTexture;
    Grid.spriteTexture = Texture.from('assets/grid.png', { scaleMode: SCALE_MODES.NEAREST });
    // Listen for the texture update and assign the rectangle size
    Grid.spriteTexture.baseTexture.on('update', (tex: BaseTexture) => Grid.rectangleCount.set(tex.width / 16, tex.height / 16));
    return Grid.spriteTexture;
  }

  constructor(container: Container, width: number = 32, height: number = 32, cacheSize: number = 64) {
    super();
    // Make sure the grid texture gets loaded
    Grid.getGridTexture();
    // The grid gets ready on texture update
    this._ready = Grid.spriteTexture.valid;
    Grid.spriteTexture.baseTexture.once('update', () => {
      this._ready = true;
      this.emit('ready');
    });

    this.lastUpdateSize = new Point();
    this.lastUpdatePosition = new Point();
    this.gridContainer = new ParticleContainer();
    this.gridContainer.zIndex = -999999;
    this.pWidth = width;
    this.pHeight = height;
    this.container = container;
    this.cache = [];
    this.growCache(cacheSize);
  }

  /**
   * The actual rendered grid.
   */
  get renderedContainer(): Container {
    return this.gridContainer;
  }

  /**
   * The container this grid is attached to.
   */
  get container(): Container {
    return this.pContainer;
  }

  set container(container: Container) {
    this.change('container', this.pContainer, container, () => {
      if (this.pContainer) this.pContainer.removeChild(this.gridContainer);
      this.pContainer = container;
      if (this.pContainer) this.pContainer.addChildAt(this.gridContainer, 0);
    });
  }

  /**
   * The width of the grid.
   */
  get width(): number {
    return this.pWidth;
  }

  set width(width: number) {
    // We do not allow to fall below 8, since it causes issues and makes no sense
    width = Math.max(8, width);
    this.change('width', this.pWidth, width, () => (this.pWidth = width));
  }

  /**
   * The grid height
   */
  get height(): number {
    return this.pHeight;
  }

  set height(height: number) {
    // We do not allow to fall below 8, since it causes issues and makes no sense
    height = Math.max(8, height);
    this.change('height', this.pHeight, height, () => (this.pHeight = height));
  }

  /**
   * Determines whether the grid is ready for updates or not.
   */
  get isReady(): boolean {
    return this._ready;
  }

  /**
   * Grows the internal display object cache.
   *
   * @param amount Determines how many times the cache should grow.
   */
  private growCache(amount: number): void {
    this.growingCache = true;
    if (!this._ready) {
      this.once('ready', () => this.growCache(amount));
      return;
    }

    // Trigger that we are going to grow the cache
    this.emit('cache.growing');
    for (let i = 0; i < amount; i++) this.cache.push(new Sprite(Grid.spriteTexture));
    // If we are done growing, trigger it
    this.growingCache = false;
    this.emit('cache.grown');
  }

  /**
   * Updates the visualization of this grid.
   *
   * @param width The width
   * @param height The height
   */
  update(width: number, height: number): Grid {
    if (this.container.position.x === this.lastUpdatePosition.x && this.container.position.y === this.lastUpdatePosition.y &&
        this.lastUpdateSize.x === width && this.lastUpdateSize.y === height) return this;
    this.lastUpdateSize.set(width, height);
    this.lastUpdatePosition.copyFrom(this.container.position);
    // If the cache is growing, wait until it is done and re-update
    if (this.growingCache) return this.once('cache.grown', () => this.update(width, height));
    // Convert the viewport into container coordinates
    const topLeft = this.container.toLocal(new Point());
    topLeft.x = Math.floor(topLeft.x / this.pWidth) * this.pWidth;
    topLeft.y = Math.floor(topLeft.y / this.pHeight) * this.pHeight;

    // Clear the sprite
    this.gridContainer.removeChildren();

    let row = 0, col = 0;
    let done = true, container: Sprite;
    for (let i = 0, l = this.cache.length; i < l; i++) {
      container = this.cache[i];
      this.gridContainer.addChild(container);
      // Calculate the correct positions and offsets
      const xx = topLeft.x + col * Grid.rectangleCount.x * this.pWidth;
      const yy = topLeft.y + row * Grid.rectangleCount.y * this.pHeight;
      const xOffset = -this.pWidth * Math.sign(Math.abs(xx) % (this.pWidth * 2));
      const yOffset = -this.pHeight * Math.sign(Math.abs(yy) % (this.pHeight * 2));
      container.position.set(xx + xOffset, yy + yOffset);
      container.scale.set(this.pWidth / 16, this.pHeight / 16);

      // Get the global coordinates of the bottom right point
      const bounds = container.getLocalBounds();
      const bottomRight = container.toGlobal(new Point(bounds.x + bounds.width, bounds.y + bounds.height));
      const reachedWidth = bottomRight.x >= width;
      const reachedHeight = bottomRight.y >= height;
      const isEnd = reachedWidth && reachedHeight;

      // If we did not fill up, increase the particle container cache
      if (i === this.cache.length - 1 && !isEnd) {
        done = false;
        this.growCache(1);
        this.update(width, height);
        break;
      }
      // Check if we reached the width of the screen
      if (reachedWidth) {
        // If we also reached the height, we cancel iteration here
        if (reachedHeight) break;
        // Otherwise we jump to the next row and fill it
        col = 0;
        row++;
      } else col++; // Jump to the next column and render it
    }
    // Trigger the event only if we completed the iterations without growing
    if (done) this.emit('update', width, height);
    return this;
  }
}

export default Grid;
