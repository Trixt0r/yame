import { DirectoryAsset } from '../../../../common/asset/directory';
import { AssetService } from '../service/asset';
import { Asset } from '../../../../common/asset';
import { AssetGroup } from '../../../../common/asset/group';
import { Component, ElementRef, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { MatButton, MatListItem } from '@angular/material'

import { WorkspaceService } from '../service';

import { DirectoryContent } from "../../../../common/content/directory";

/**
 * Open event definition.
 *
 * @interface OpenEvent
 */
interface OpenEvent {
  previous: AssetGroup<Asset>,
  group: AssetGroup<Asset>,
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
 */
@Component({
  moduleId: module.id,
  selector: 'groups',
  templateUrl: 'groups.html',
  styleUrls: ['./groups.scss'],
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
export class GroupsComponent implements OnInit {

  /** @type {EventEmitter<OpenEvent>} The opening event, triggered as soon as a click on a group happens. */
  @Output('opening') opening: EventEmitter<OpenEvent> = new EventEmitter();

  /** @type {EventEmitter<OpenEvent>} The opened event, triggered as soon as the slide animation has been done. */
  @Output('opened') opened: EventEmitter<OpenEvent> = new EventEmitter();

  /** @type {MatButton} The menu trigger button for the parent menu, which is not visible. */
  @ViewChild('parentMenuTrigger') parentMenuTrigger: MatButton;

  // Internal vars which have not to be available to the public
  private groups: AssetGroup<Asset>[]; // Current files
  private openingGroups: AssetGroup<Asset>[]; // Preview of files which will be displayed on animation end
  private slide = 'none'; // slide state, either 'none', 'open', 'close'
  private currentlyOpen: AssetGroup<Asset>; // Current directory
  private previouslyOpen: AssetGroup<Asset>; // Previous directory
  private currentParents: AssetGroup<Asset>[]; // List of parents of the current directory
  private previousScrolls = []; // Scroll states for each directory

  constructor(
    public ref: ElementRef,
    private ws: WorkspaceService,
    private assets: AssetService) {
  }

  /**
   * Opens the given group.
   * A swipe animation will be started in the correct direction automatically based on the given group and the
   * hierarchy.
   *
   * @param {AssetGroup<Asset>} group The group to open.
   */
  open(group: AssetGroup<Asset>): void {
    let close = this.parents.indexOf(group) >= 0; // We close, if we open a parent group
    // Store the scroll state for each group so we can restore it if the user moves back
    if (!close) this.previousScrolls.push(this.ref.nativeElement.scrollTop);
    this.slide = close ? 'close' : 'open';
    this.openingGroups = this.assets.getGroups(group);
    this.previouslyOpen = this.currentlyOpen;
    this.currentlyOpen = group;
    this.currentParents = this.assets.getParents(this.currentlyOpen).reverse();
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
      this.parentMenuTrigger._elementRef.nativeElement.click();
    else if (event.which === 1)
      this.open(this.current.parent);
  }

  /** @inheritdoc */
  ngOnInit(): Promise<void> {
    return this.assets.fromFs(this.ws.directory)
            .then(group => {
              this.currentlyOpen = <AssetGroup<Asset>>group;
              this.previouslyOpen = this.currentlyOpen;
              this.groups = this.assets.getGroups(this.currentlyOpen);
              this.currentParents = [];
            });
  }

  /**
   * Handles the slide animation start.
   * Triggers the opening event if we the slide state changes either to `close` or `open`.
   *
   * @param {AnimationEvent} event
   */
  slideAnimStart(event: AnimationEvent): void {
    if (event.fromState !== 'none') return;
    this.ref.nativeElement.classList.add('no-overflow');
    this.ref.nativeElement.scrollTop = 0;
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
    this.ref.nativeElement.classList.remove('no-overflow');
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
      let idx = this.assets.getParents(this.previous).reverse().indexOf(this.current);
      this.ref.nativeElement.scrollTop = this.previousScrolls[idx];
      this.previousScrolls.splice(idx, this.previousScrolls.length - idx); // Clear all states from the found index
    }
  }

  /**
   * The currently selected group.
   *
   * @readonly
   * @type {AssetGroup<Asset>}
   */
  get current(): AssetGroup<Asset> {
    return this.currentlyOpen;
  }

  /**
   * The previously selected group.
   *
   * @readonly
   * @type {DirectoryContent}
   */
  get previous(): AssetGroup<Asset> {
    return this.previouslyOpen;
  }

  /**
   * A parent list of the current group.
   *
   * @readonly
   * @type {AssetGroup<Asset>[]}
   */
  get parents(): AssetGroup<Asset>[] {
    return this.currentParents;
  }

  /**
   * Property used to display the back button, based on the current slide state and group.
   *
   * @readonly
   * @type {boolean}
   */
  public get displayBack(): boolean {
    return (this.slide === 'none' && this.current && this.current.id !== this.ws.directory.path) ||
            (this.slide !== 'none' && this.previous && this.previous.id != this.ws.directory.path);
  }
}
