import { Component } from '../../../common/component';
import { Point as PointComponent } from '../../../common/component/point';
import { Group } from '../accordion';
import { LabeledInput } from '../composition/labeledInput';

export class Point extends Group {
    component: PointComponent;

    constructor(options: any) {
        super(options.parent);
        this.component = options.component;
        this.title.text.$el.text(this.component.name);
        this.content.$el.addClass('component point');

        // this.content.css = 'padding-left: 0.5em; padding-right: 0.5em;';
        // this.content.subviews().forEach((v: LabeledInput) => {
        //     v.$el.removeClass('fluid');
        //     v.css = 'width: 50%;';
        //     v.input.css = 'width: 0';
        // });
        this.content.on('add', views => {
            views.forEach((v: LabeledInput) => {
                v.$el.removeClass('fluid');
                // v.css = 'width: 50%;';
                // v.input.css = 'width: 0';
            });
        })
    }
}