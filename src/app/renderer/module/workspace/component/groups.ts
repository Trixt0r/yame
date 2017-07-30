import { OnInit } from '@angular/core/public_api';
import { Component, ElementRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { MdButton } from '@angular/material'

import { WorkspaceService } from '../service';

import { DirectoryJSON } from '../../../../common/io/directory';
import { AbstractComponent } from '../../../component/abstract';

interface OpenEvent {
  previous: DirectoryJSON,
  group: DirectoryJSON,
  event: AnimationEvent
}

/**
 * The groups component.
 *
 * Displays a list of the currently selected group in the workspace.
 * Register yourself to the `opening` and `open` events to react on user actions.
 *
 * @export
 * @class GroupsComponent
 * @extends {AbstractComponent}
 */
@Component({
  moduleId: module.id,
  selector: 'groups',
  templateUrl: 'groups.html',
  styleUrls: ['groups.css'],
  animations: [
    trigger('slideState', [
      state('open', style({ transform: 'translateX(-100%)' })),
      state('none', style({ transform: 'translateX(0)' })),
      state('close', style({ transform: 'translateX(100%)' })),
      transition('none => open, none => close', animate('200ms ease-in')),
      transition('* => none, void => *', animate('0s')),
    ])
  ]
})
export class GroupsComponent extends AbstractComponent implements OnInit {

  /** @type {EventEmitter<OpenEvent>} The opening event, triggered as soon as a click on a group happens. */
  @Output('opening') opening: EventEmitter<OpenEvent> = new EventEmitter();

  /** @type {EventEmitter<OpenEvent>} The opened event, triggered as soon as the slide animation has been done. */
  @Output('opened') opened: EventEmitter<OpenEvent> = new EventEmitter();

  /** @type {MdButton} The menu trigger button for the parent menu, which is not visible. */
  @ViewChild('parentMenuTrigger') parentMenuTrigger: MdButton;

  // Internal vars which have not to be available to the public
  private groups: DirectoryJSON[]; // Current files
  private openingGroups: DirectoryJSON[]; // Preview of files which will be displayed on animation end
  private slide = 'none'; // slide state, either 'none', 'open', 'close'
  private currentlyOpen: DirectoryJSON; // Current directory
  private previouslyOpen: DirectoryJSON; // Previous directory
  private currentParents: DirectoryJSON[]; // List of parents of the current directory
  private previousScrolls = []; // Scroll states for each directory

  constructor(public ref: ElementRef, private service: WorkspaceService) {
    super(ref);
  }

  /**
   * Opens the given group.
   * A swipe animation will be started in the correct direction automatically based on the given group and the
   * hierarchy.
   *
   * @param {DirectoryJSON} group The group to open.
   */
  open(group: DirectoryJSON): void {
    let close = this.parents.indexOf(group) >= 0; // We close, if we open a parent group
    // Store the scroll state for each group so we can restore it if the user moves back
    if (!close) this.previousScrolls.push(this.$el.scrollTop());
    this.slide = close ? 'close' : 'open';
    this.openingGroups = this.service.getDirectories(group);
    this.previouslyOpen = this.currentlyOpen;
    this.currentlyOpen = group;
    this.currentParents = this.service.getParents(this.currentlyOpen).reverse();
  }

  /**
   * Handler for clicking either the back button or its containing list item.
   *
   * On right mouse button click has been pressed,
   * a list of all parents of the current group will be displayed in a menu.
   *
   * @param {MouseEvent} event
   */
  onBackClick(event: MouseEvent): void {
    if (event.which === 3 && this.parents.length > 0)
      $(this.parentMenuTrigger._getHostElement()).trigger('click');
    else if (event.which === 1)
      this.open(this.service.getParent(this.current));
  }

  /** @inheritdoc */
  ngOnInit() {
    super.ngOnInit();
    this.currentlyOpen = this.service.directory;
    this.groups = this.service.directories;
    this.currentParents = [];
  }

  /**
   * Handles the slide animation start.
   * Triggers the opening event if we the slide state changes either to `close` or `open`.
   *
   * @param {AnimationEvent} event
   */
  slideAnimStart(event: AnimationEvent): void {
    if (event.fromState !== 'none') return;
    this.$el.addClass('no-overflow').scrollTop(0);
    this.opening.emit({
      previous: this.previous,
      group: this.current,
      event: event
    });
  }

  /**
   * Handles the slide animation end.
   * The scroll of the component will be fixed if a group got closed.
   *
   * @param {AnimationEvent} event
   */
  slideAnimDone(event: AnimationEvent): void {
    if (event.fromState !== 'none') return; // React only if we come from the 'none' state
    this.$el.removeClass('no-overflow');
    this.fixScroll(event);
    this.groups = this.openingGroups;
    this.slide = 'none';
    this.opened.emit({
      previous: this.previous,
      group: this.current,
      event: event
    });
    delete this.openingGroups;
  }

  /**
   * Fixes the scroll, i.e. restores the scroll state if we open a parent group (close current group).
   *
   * @private
   * @param {AnimationEvent} event
   */
  private fixScroll(event: AnimationEvent) {
    if (event.toState === 'close') {
      let idx = this.service.getParents(this.previous).reverse().indexOf(this.current);
      this.$el.finish().animate({ scrollTop: this.previousScrolls[idx] }, 'fast');
      this.previousScrolls.splice(idx, this.previousScrolls.length - idx); // Clear all states from the found index
    }
  }

  /**
   * The currently selected group.
   *
   * @readonly
   * @type {DirectoryJSON}
   */
  get current(): DirectoryJSON {
    return this.currentlyOpen ? this.currentlyOpen : this.service.directory;
  }

  /**
   * The previously selected group.
   *
   * @readonly
   * @type {DirectoryJSON}
   */
  get previous(): DirectoryJSON {
    return this.previouslyOpen ? this.previouslyOpen : this.service.directory;
  }

  /**
   * A parent list of the current group.
   *
   * @readonly
   * @type {DirectoryJSON[]}
   */
  get parents(): DirectoryJSON[] {
    return this.currentParents ? this.currentParents : [];
  }

  /**
   * Property used to display the back button, based on the current slide state and group.
   *
   * @readonly
   * @private
   * @type {boolean}
   */
  private get displayBack(): boolean {
    return (this.slide === 'none' && this.current !== this.service.directory) ||
            (this.slide !== 'none' && this.previous != this.service.directory);
  }
}