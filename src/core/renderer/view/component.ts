import {Component as CompModel} from '../../common/component';

export interface Component<T extends CompModel<any>> {
    component: T
}