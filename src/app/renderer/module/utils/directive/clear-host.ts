import { Directive, ElementRef, OnInit } from "@angular/core";

/**
 * Helper directive which removes the host element.
 *
 * @export
 * @class ClearHostDirective
 * @implements {OnInit}
 */
@Directive({
  selector: '[clear-host]',
})
export class ClearHostDirective implements OnInit {

  constructor(private el: ElementRef) { }

  /** @inheritdoc */
  ngOnInit() {
    var nativeElement: HTMLElement = this.el.nativeElement,
        parentElement: HTMLElement = nativeElement.parentElement;
    // move all children out of the element
    while (nativeElement.firstChild)
      parentElement.insertBefore(nativeElement.firstChild, nativeElement);
    // remove the empty element(the host)
    parentElement.removeChild(nativeElement);
  }
}
