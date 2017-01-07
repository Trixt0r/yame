import { Component } from '../../../common/component';
import { Point as PointComponent } from '../../../common/component/point';
import { Group } from '../accordion';
import { LabeledInput } from '../composition/labeledInput';

export class Point extends Group {
    component: PointComponent;

    constructor(options: any) {
        super();
        this.component = options.component;
        this.title.text.$el.text(this.component.name);
        this.content.$el.addClass('component point');

        this.content.on('add', views => {
            views.forEach((v: LabeledInput) => {
                v.$el.removeClass('fluid');
            });
        })
    }
}