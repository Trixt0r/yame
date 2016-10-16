import {Entity} from '../entity';
var randomstring = require("randomstring");

export class Mesh extends PIXI.Container implements Entity {

    private _mesh: PIXI.mesh.Mesh;
    public id: string;
    public layer: string;

    constructor(texture: PIXI.Texture, vertices: PIXI.Point[], uvs: PIXI.Point[]) {
        super();

        this.id = 'mesh-' + randomstring.generate(8);

        var _vertices = [];
        var _uvs = [];
        var _indices = [];

        vertices.forEach(vertex => _vertices.push(vertex.x, vertex.y) );
        uvs.forEach(uv => _uvs.push(uv.x, uv.y) );

        for (let i = 2, len = vertices.length; i < len; i++ ) {
            _indices.push(0);
            _indices.push(i - 1);
            _indices.push(i);
        }
        console.log(_indices);

        this._mesh = new PIXI.mesh.Mesh(texture,
                                        <any>new Float32Array(_vertices),
                                        <any>new Float32Array(_uvs),
                                        <any>new Int16Array(_indices));
        var width = this._mesh.width;
        var height = this._mesh.width;
        _vertices = [];
        vertices.forEach(vertex => _vertices.push(vertex.x - width/2, vertex.y - height / 2) );
        this._mesh.vertices = <any>new Float32Array(_vertices);
        this.addChild(this._mesh);
    }

    /** @inheritdoc */
    get type(): string {
        return 'Mesh';
    }

    /** @inheritdoc */
    toJSON(): any {
        // NOP
        return {};
    }

    /** @inheritdoc */
    parse(json: any, rootPath: string) {
        // NOP
    }
}
