import { Resources } from './../../../entity/resources';
import { Resource } from '../../../entity/resource';
import { List } from '../../../../core/view/list';
import { View } from './../../../../core/view/abstract';

import * as _ from 'underscore';

/**
 * View for displaying resource for a specific library.
 */
export class ResourcesView extends List {

    private _resources: Resources<Resource>;

    constructor(options: any = {}) {
        super(_.extend({
            className: 'ui middle aligned selection animated list'
        }, options));
        if (options.resources instanceof Resources)
            this.resources = options.resources;

    }

    /**
     * Adds the given resource to this list if it is not already part of it.
     * @param  {R}      resource
     * @chainable
     */
    addResource(resource: Resource) {
        let found = this.find(view => resource == view.model);
        // Don't add a present resource to this view
        if (found) {
            console.warn('Resource with id',
                          resource.id, 'has already been added.');
            return;
        }

        let img = resource.image.clone();
        this.add(img);
        img.$el.removeClass().addClass('ui avatar image sprite');
        var name = new View({ className: 'content' });
        name.$el.html('<div class="header">' + resource.displayName + '</div>');
        img.parent.add(name);
        img.parent.$el.attr('draggable', 'true');

        // If the resource changes, update the display name
        resource.on('change', () => {
            img.src = resource.image.src;
            name.$('div').text(resource.displayName);
        });

        // Delegate the dragstart event to anyone else
        img.parent.$el.bind('dragstart',
                            (e) => this.trigger('dragstart', resource, e));
        img.parent.$el.on('click', () => {
            this.$('.item').removeClass('active');
            img.parent.$el.addClass('active');
            this.trigger('selected', resource);
        });

        // Store reference to delete or check presence
        img.parent.model = <any>resource;
        this.trigger('add:resource', resource);
        return this;
    }

    /**
     * Removes the view for the given resource from this list.
     * @param  {R}      resource
     * @chainable
     */
    removeResource(resource: Resource) {
        let found = this.find(view => view.model == resource);
        if (found) this.delete(found, true);
        return this;
    }

    /**
     * Refreshes the view, i.e. empties itself and re-renders all resources.
     * @chainable
     */
    refresh() {
        this.empty();
        this._resources.resources.forEach(resource => this.addResource(resource));
        return this;
    }

    /**
     * Updates the resources model of this view and renders the new resources.
     * @param  {Resources<R>} resources
     * @returns {void}
     */
    set resources(resources: Resources<Resource>) {
        if (this._resources)
            this._resources.off(null, null, this);
        this._resources = resources;
        // Listen for resource changes and apply them to the view
        resources.on('add', resource => this.addResource(resource));
        resources.on('remove', resource => this.removeResource(resource));
        this.refresh();
        this.trigger('change:resources');
    }

    /** @returns {Resources<Resource>} The resources model of this view. */
    get resources(): Resources<Resource> {
        return this._resources;
    }
}
