import { Component } from '../../../common/component';

export class Renderer
       extends Component<{ displayObject?: PIXI.Container,
                           options?: Component<any> }> {

    constructor(name: string, displayObject: PIXI.Container) {
        super(name, { });
        this._value.displayObject = displayObject;
    }

    /** @inheritdoc */
    get type(): string {
        return 'renderer';
    }

    /**
     * The display object of this renderer.
     * @readonly
     * @type {PIXI.Container}
     */
    get displayObject(): PIXI.Container {
        return this._value.displayObject;
    }

    /** @inheritdoc */
    copy(value?: PIXI.Container): Renderer {
        if (!value)
            value = new PIXI.Container();
        let copy = new (<any>this.constructor)(this._name, value);
        value.position.set(this.displayObject.position.x, this.displayObject.position.y);
        value.scale.set(this.displayObject.scale.x, this.displayObject.scale.y);
        value.pivot.set(this.displayObject.pivot.x, this.displayObject.pivot.y);
        value.skew.set(this.displayObject.skew.x, this.displayObject.skew.y);
        value.rotation = this.displayObject.rotation;
        value.alpha = this.displayObject.alpha;
        value.visible = this.displayObject.visible;
        return copy;
    }

    /** @inheritdoc */
    toJSON(options?: any): any {
        return {
            alpha: this.displayObject.alpha,
            visible: this.displayObject.visible
        };
    }

    /** @inheritdoc */
    fromJSON(json: any, options?: any): Renderer {
        this.displayObject.alpha = json.alpha === void 0 ? 1 : json.alpha;
        this.displayObject.visible = json.visible === void 0 ? true : json.visible;
        return this;
    }
}