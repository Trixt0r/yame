import { ISortable } from './interfaces/sortable.interface';

/**
 * Sorts the given list of options by their positions.
 *
 * @param options The list to sort.
 */
export function sort<T extends Partial<ISortable>[]>(options: T): T {
  return options.sort((a, b) => {
    if (typeof a.position === 'number' && typeof b.position === 'number')
      return a.position - b.position;
    else if (typeof a.position === 'number')
      return -1;
    else if (typeof b.position === 'number')
      return 1;
    else
      return 0;
  });
}