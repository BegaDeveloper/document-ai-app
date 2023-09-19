import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { Panel } from 'primeng/panel';

@Directive({
  selector: '[appPanelToggler]',
})
export class PanelTogglerDirective {
  @Input('appPanelToggler') panel!: Panel;

  constructor(private el: ElementRef) {}

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    if (this.panel) {
      this.panel.toggle(event);
    }
  }
}
