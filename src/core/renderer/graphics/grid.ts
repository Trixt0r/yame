import { EventBus } from '../../common/eventbus';
import Camera from '../scene/camera';

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

    /** @type {PIXI.Container} gridContainer Container for rendering the grid. */
    private gridContainer: PIXI.Container;

    /** @type {boolean} growingCache Whether the cache is growing. */
    private growingCache: boolean;

    /** @type {PIXI.particles.ParticleContainer[]} cache Internal cache*/
    private cache: PIXI.particles.ParticleContainer[];

    /**
     * @static
     * @type {number} cacheGrowFactor Factor for generating the grid.
     */
    private static cacheGrowFactor: number = 100; // = 10'000 per container

    /**
     * @static
     * @type {PIXI.Texture} spriteTexture Internal texture for the rectangles.
     */
    private static spriteTexture: PIXI.Texture;

    private static renderTexture(renderer: PIXI.SystemRenderer) {
        if (Grid.spriteTexture) return;
        let graphics = new PIXI.Graphics();
        graphics.beginFill(0x212121);
        graphics.lineStyle(0, 0);
        graphics.drawRect(0, 0, 16, 16);
        graphics.endFill();
        Grid.spriteTexture = renderer.generateTexture(graphics, 1, 1);
    }

    constructor(container: PIXI.Container,
                renderer: PIXI.SystemRenderer,
                width: number = 32,
                height: number = 32,
                cacheSize: number = 64) {
        super();
        if (!Grid.spriteTexture)
            Grid.renderTexture(renderer);
        this.gridContainer = new PIXI.Container();
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
        // Trigger that we are going to grow the cache
        this.trigger('cache:growing');
        for (let i = 0; i < amount; i++)
            setTimeout(() => {
                let container = new PIXI.particles.ParticleContainer(Grid.cacheGrowFactor*Grid.cacheGrowFactor);
                for (let x = 0; x < Grid.cacheGrowFactor; x++) {
                    for (let y = 0; y < Grid.cacheGrowFactor; y++ ) {
                        let sprite = new PIXI.Sprite(Grid.spriteTexture);
                        sprite.position.set(x * 32 + 16 * (y % 2), y * 16);
                        container.addChild(sprite);
                    }
                }
                this.cache.push(container);
            }, i * 1);

        // If we are done growing, trigger it
        setTimeout(() => {
            this.growingCache = false;
            this.trigger('cache:grown');
        }, amount * 1);
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
            let xx = topLeft.x + (col * Grid.cacheGrowFactor) * this.width * 2;
            let yy = topLeft.y + (row * Grid.cacheGrowFactor) * this.height;
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

    /** @type {PIXI.Container} camera The camera */
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
        // We do not allow to fall below 16, since it causes issues and makes no sense
        width = Math.max(16, width);
        this.change('width', this.pWidth, width, () => this.pWidth = width);
    }

    /** @type {number} height The grid height */
    get height(): number {
        return this.pHeight;
    }

    set height(height: number) {
        // We do not allow to fall below 16, since it causes issues and makes no sense
        height = Math.max(16, height);
        this.change('height', this.pHeight, height, () => this.pHeight = height);
    }
}

export default Grid;