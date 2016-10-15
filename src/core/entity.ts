export abstract class Entity {

    id: string;
    type: string;
    layer: string;

    abstract toJSON(parentPath: string): any;
    abstract parse(json: any, parentPath: string);
}
