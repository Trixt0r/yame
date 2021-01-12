import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'color',
})
export class ColorPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'number') {
      let re = value.toString(16);
      if (re.length % 2) re = '0' + re;
      re = '#' + re;
      return re;
    }
    return value;
  }
}
