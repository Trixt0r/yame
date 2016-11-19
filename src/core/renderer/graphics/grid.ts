import { EventBus } from '../../common/eventbus';

import Environment from '../../common/environment';

import * as path from 'path';

/**
 * Class for rendering a grid in a specific 2D container.
 * @export
 * @class Grid
 */
export class Grid extends EventBus {

    /** @type {number} pWidth Grid width. */
    private pWidth: number;

    /** @type {number} pHeight Grid height. */
    private pHeight: number;

    /** @type {PIXI.Container} pContainer The container this grid is attached to. */
    private pContainer: PIXI.Container;

    /** @type {PIXI.Container} gridContainer Container for rendering the grid.*/
    private gridContainer: PIXI.Container;

    /** @type {boolean} growingCache Whether the cache is growing. */
    private growingCache: boolean;

    /** @type {PIXI.Sprite[]} cache Internal cache of sprites. */
    private cache: PIXI.Sprite[];

    /**
     * NOTE: The grid texture consits of 16x16 rectangles
     * @static
     * @type {PIXI.Texture} spriteTexture Internal texture for the rectangles.
     */
    private static spriteTexture: PIXI.Texture;

    /**
     * @static
     * @type {PIXI.Point} rectangleCount Amount of rectangles on each axis
     */
    private static rectangleCount: PIXI.Point = new PIXI.Point();


    /**
     * @static
     * @returns {PIXI.Texture} The grid texture.
     */
    public static getGridTexture(): PIXI.Texture {
        if (Grid.spriteTexture) return Grid.spriteTexture;
        Grid.spriteTexture = PIXI.Texture.fromImage(
            path.resolve(Environment.baseDir, 'assets/core/grid.png'),
            true,
            PIXI.SCALE_MODES.NEAREST); // use pixelated filter
        // Listen for the texture update and assign the rectangle size
        Grid.spriteTexture.baseTexture
            .on('update',
            tex => Grid.rectangleCount.set(tex.width / 16, tex.height / 16) );
        return Grid.spriteTexture;
    }

    constructor(container: PIXI.Container,
                width: number = 32,
                height: number = 32,
                cacheSize: number = 64) {
        super();
        // Make sure the grid texture gets loaded
        Grid.getGridTexture();
        this.gridContainer = new PIXI.particles.ParticleContainer();
        this.pWidth = width;
        this.pHeight = height;
        this.container = container;
        this.cache = [];
        this.growCache(cacheSize);
    }

    /**
     * Grows the internal display object cache.
     *
     * @private
     * @param {number} amount
     */
    private growCache(amount: number) {
        this.growingCache = true;
        if (Grid.spriteTexture.baseTexture.isLoading)
            return Grid.spriteTexture.baseTexture
                    .once('update', () => this.growCache(amount));
        // Trigger that we are going to grow the cache
        this.trigger('cache:growing');
        for (let i = 0; i < amount; i++)
            this.cache.push(new PIXI.Sprite(Grid.spriteTexture));
        // If we are done growing, trigger it
        this.growingCache = false;
        this.trigger('cache:grown');
    }

    /**
     * Updates the visualization of this grid.
     *
     * @param {number} width
     * @param {number} height
     * @chainable
     */
    update(width: number, height: number): Grid {
        // If the cache is growing, wait until it is done and re-update
        if (this.growingCache)
            return this.once('cache:grown', () => this.update(width, height));
        // Convert the viewport into container coordinates
        let topLeft = this.container.toLocal(new PIXI.Point());
        topLeft.x = Math.floor(topLeft.x / this.width) * this.width;
        topLeft.y = Math.floor(topLeft.y / this.height) * this.height;

        // Clear the sprite
        this.gridContainer.removeChildren();

        let row = 0, col = 0;
        let end = false, done = true;
        this.cache.forEach((container, i) => {
            if (end) return;
            this.gridContainer.addChild(container);
            // Calculate the correct positions and offsets
            let xx = topLeft.x + (col * Grid.rectangleCount.x) * this.width;
            let yy = topLeft.y + (row * Grid.rectangleCount.y) * this.height;
            let xOffset = -this.width * Math.sign(Math.abs(xx) % (this.width * 2 ));
            let yOffset = -this.height * Math.sign(Math.abs(yy) % (this.height * 2));
            container.position.set(xx + xOffset, yy + yOffset);
            container.scale.set(this.width / 16, this.height / 16);

            // Get the global coordinates of the bottom right point
            let bounds = container.getLocalBounds();
            let bottomRight = container.toGlobal( new PIXI.Point(bounds.x + bounds.width, bounds.y + bounds.height) );
            let reachedWidth = bottomRight.x >= width;
            let reachedHeight = bottomRight.y >= height;
            let isEnd = reachedWidth && reachedHeight;

            // If we did not fill up, increase the particle container cache
            if (i == this.cache.length - 1 && !isEnd) {
                end = true;
                done = false;
                this.growCache(1);
                return this.update(width, height);
            }
            // Check if we reached the width of the screen
            if (reachedWidth) {
                // If we also reached the height, we cancel iteration here
                if (reachedHeight)
                    end = true;
                // Otherwise we jump to the next row and fill it
                else {
                    col = 0;
                    row++;
                }
            } else // Jump to the next column and render it
                col++;
        });
        // Trigger the event only if we completed the iterations without growing
        if (done)
            this.trigger('update', width, height);
        return this;
    }

    /** @type {PIXI.Container} container The container this grid is attached to*/
    get container(): PIXI.Container {
        return this.pContainer;
    }

    set container(container: PIXI.Container) {
        this.change('container', this.pContainer, container, () => {
            if (this.pContainer) {
                // this.pContainer.removeChild(this.graphics);
                this.pContainer.removeChild(this.gridContainer);
            }
            this.pContainer = container;
            this.pContainer.addChildAt(this.gridContainer, 0);
        });
    }

    /** @type {number} width The width of the grid. */
    get width(): number {
        return this.pWidth;
    }

    set width(width: number) {
        // We do not allow to fall below 4, since it causes issues and makes no sense
        width = Math.max(4, width);
        this.change('width', this.pWidth, width, () => this.pWidth = width);
    }

    /** @type {number} height The grid height */
    get height(): number {
        return this.pHeight;
    }

    set height(height: number) {
        // We do not allow to fall below 4, since it causes issues and makes no sense
        height = Math.max(4, height);
        this.change('height', this.pHeight, height, () => this.pHeight = height);
    }
}

export default Grid;