import { Group } from './group';
import { Entity, EntityType } from './entity';

@EntityType()
export class Layer extends Group<Entity> {}
