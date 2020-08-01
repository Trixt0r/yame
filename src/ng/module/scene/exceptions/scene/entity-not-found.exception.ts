import { SceneException } from '../scene.exception';
import { SceneEntity } from 'common/scene';


export class EntityNotFoundException extends SceneException {
  constructor(message: string, entityOrId: string | SceneEntity) {
    super(`${message}: ${ entityOrId instanceof SceneEntity ? entityOrId.id : entityOrId }`);
  }
}
