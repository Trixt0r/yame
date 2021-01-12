import { SceneEntity } from 'common/scene';
import { SceneComponentService } from '../../services/component.service';
import { ValidatorFn, AbstractControl } from '@angular/forms';


/**
 * Validator for validating component ids.
 *
 * @param initial The initial value.
 * @param entities The scene entities to check for.
 * @param components The scene component service instance.
 * @return A validator function for validating component ids.
 */
export function componentIdValidator(
  initial: string,
  entities: SceneEntity[],
  components: SceneComponentService
): ValidatorFn {
  return (control: AbstractControl): { idUsed?: any; idReserved?: any } | null => {
    if (control.value === initial) return null;
    const found = entities.find(it => components.isIdInUse(control.value, it.id));
    if (found) return { idUsed: { value: control.value } };
    if (components.isIdReserved(control.value)) return { idReserved: { value: control.value } };
    return null;
  };
}
