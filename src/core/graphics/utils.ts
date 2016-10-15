/**
 * Utility function for checking whether the container hits the given rectangle.
 * NOTE: Make sure u bind this function to your `this` scope!
 * @param  {PIXI.Rectangle} rect
 * @param  {PIXI.Container} box
 * @returns {void}
 */
export function checkCollision(rect: PIXI.Rectangle, box: PIXI.Container) {

        var bounds = this.getLocalBounds();

        var topLeft = new PIXI.Point(bounds.x, bounds.y);
        topLeft = this.toGlobal(topLeft);
        var topRight = new PIXI.Point(bounds.x + bounds.width, bounds.y);
        topRight = this.toGlobal(topRight);
        var bottomLeft = new PIXI.Point(bounds.x, bounds.y + bounds.height);
        bottomLeft = this.toGlobal(bottomLeft);
        var bottomRight = new PIXI.Point(bounds.x + bounds.width, bounds.y + bounds.height);
        bottomRight = this.toGlobal(bottomRight);

        var overlapping = this.containsPoint(new PIXI.Point(rect.x, rect.y)) ||
                            this.containsPoint(new PIXI.Point(rect.x + rect.width, rect.y)) ||
                            this.containsPoint(new PIXI.Point(rect.x, rect.y + rect.height)) ||
                            this.containsPoint(new PIXI.Point(rect.x + rect.width, rect.y + rect.height)) ||
                            rect.contains(topLeft.x, topLeft.y) || rect.contains(topRight.x, topRight.y) ||
                            rect.contains(bottomLeft.x, bottomLeft.y) || rect.contains(bottomRight.x, bottomRight.y);
        // var overlap = (rect1, rect2) => {
        //     return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
        //             rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
        // }
        // var overlapping = overlap(bounds, rect);
        if (overlapping)
            box.addChild(this);
}
