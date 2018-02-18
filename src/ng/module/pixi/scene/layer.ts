import { Group } from "./group";
import { Entity } from "./entity";

export class Layer extends Group<Entity> {

}

Entity.registerEntityType(Layer);
