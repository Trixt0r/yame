import { Boolean } from '../../../common/component/boolean';
import { Number } from '../../../common/component/number';
import { Component, component } from '../../../common/component';

class Options extends Component<any> {

    /** @inheritdoc */
    get type(): string {
        return 'rendererOptions';
    }

    /** @inheritdoc */
    copy(): Options {
        return new Options(this._name, JSON.parse(JSON.stringify(this._value)));
    }
}

export class Renderer
       extends Component<{ displayObject?: PIXI.Container,
                           alpha?: Number,
                           visible?: Boolean,
                           options?: Options }> {

    @component options: Component<any>;
    @component alpha: Number;
    @component visible: Boolean;

    constructor(name: string, displayObject: PIXI.Container) {
        super(name, { });
        this._value.displayObject = displayObject;
        this._value.options = new Options('options', { });
        this._value.alpha = new Number('alpha', displayObject.alpha);
        this._value.visible = new Boolean('visible', displayObject.visible);

        this.alpha.on('change', alpha => this.displayObject.alpha = alpha );
        this.visible.on('change', visible => this.displayObject.renderable = visible );

        this.delegateOn('change', this.alpha)
            .delegateOn('change', this.visible);
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
        value.rotation = this.displayObject.rotation;
        value.alpha = this.displayObject.alpha;
        value.visible = this.displayObject.visible;
        return copy;
    }

    /** @inheritdoc */
    toJSON(options?: any): any {
        let re = super.toJSON(options);
        // Make sure the deisplayObject gets not exported
        delete re.displayObject;
        return re;
    }
}