import { Component, ElementRef } from "@angular/core";
import { RippleAnimationConfig } from "@angular/material";

@Component({
  moduleId: module.id,
  selector: 'toolbar',
  templateUrl: 'component.html',
  styleUrls: ['component.scss']
})
export class ToolbarComponent {

  protected toggled = false;
  protected rippleAnimationConfig: RippleAnimationConfig = {
    enterDuration: 100,
    exitDuration: 100,
  }

  constructor(public ref: ElementRef) {

  }

  toggle() {
    let element = <HTMLDivElement>this.ref.nativeElement;
    element.classList.toggle('toggled');
    this.toggled = element.classList.contains('toggled');
  }
}
