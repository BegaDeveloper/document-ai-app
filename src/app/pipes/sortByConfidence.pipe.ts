import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortByConfidence',
})
export class SortByConfidencePipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    return array.sort((a, b) => {
      if (b[field] === a[field]) {
        return a['originalIndex'] - b['originalIndex'];
      }
      return b[field] - a[field];
    });
  }
}
