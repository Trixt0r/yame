import { AssetService } from '../service/asset';
import { AssetGroup } from '../../../../common/asset/group';
import { Asset } from '../../../../common/asset';
import { KeyboardService } from '../../../service/keyboard';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  AnimationTransitionEvent
} from '@angular/core';

import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

import { DomSanitizer } from '@angular/platform-browser';

import * as path from 'path';
import { AbstractComponent } from "../../../component/abstract";
import { DirectoryContent } from "../../../../common/content/directory";
import { FileContent } from "../../../../common/content/file";

/**
 * Assets component responsible for controling the assets view.
 *
 * The assets component gets assigned a certain asset group to display.
 *
 * @export
 * @class AssetsComponent
 * @extends {AbstractComponent}
 * @implements {OnChanges}
 * @implements {AfterViewInit}
 */
@Component({
  moduleId: module.id,
  selector: 'assets',
  templateUrl: 'assets.html',
  styleUrls: ['assets.css'],
  providers: [KeyboardService],
  animations: [
    trigger('searchState', [
      state('inactive', style({
        transform: 'translate(205%)'
      })),
      state('active', style({
        transform: 'translate(0)'
      })),
      transition('inactive => active', animate('200ms ease-in')),
      transition('active => inactive', animate('200ms ease-out'))
    ])
  ]
})
export class AssetsComponent extends AbstractComponent implements OnChanges, AfterViewInit {

  private handledByKeys: boolean;
  private bcIdx = 0;

  @Input() group: AssetGroup<Asset>;
  @Output('select') selectEvent = new EventEmitter();
  @Output('breadcrumb') breadcrumbEvent = new EventEmitter();
  @ViewChild('search') search: ElementRef;
  @ViewChild('breadcrumbs') breadcrumbs: ElementRef;
  @ViewChild('filesContainer') filesContainer: ElementRef;
  @ViewChild('noFilesContainer') noFilesContainer: ElementRef;

  private assets: Asset[];

  private searching = 'inactive';

  private displayedFiles: Asset[];

  private selection: Asset;

  constructor(public ref: ElementRef, private sanitizer: DomSanitizer, private keyboardService: KeyboardService, private as: AssetService) {
    super(ref);
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  sanitize(url: string): string {
    return <string>this.sanitizer.bypassSecurityTrustUrl(url);
  }

  isImage(url: string): boolean {
    return path.extname(url).indexOf('png') >= 0;
  }

  /**
   * Keyboard handler for breadcrumbs.
   *
   * @param {KeyboardEvent} event
   * @param {number} idx
   * @returns {void}
   */
  brKeyDown(event: KeyboardEvent, idx: number): void {
    // switch (event.keyCode) {
    //   case 27:
    //   case 8:
    //   case 37: this.focusBcIdx(idx - 1); break;
    //   case 39: this.focusBcIdx(idx + 1); break;
    //   case 40: event.preventDefault(); // no scroll
    //            this.focusFileIdx(this.displayedFiles.indexOf(this.selection)); break;
    // }
  }

  /**
   * Focuses the given breadcrumb index.
   *
   * @param {number} idx
   * @returns {void}
   */
  focusBcIdx(idx: number): void {
    // $($(this.breadcrumbs.nativeElement).find('a')[Math.max(0, Math.min(idx, this.path.length - 2))]).focus();
  }

  /**
   * Handler for selection the given file item by clicking or using the keyboard.
   *
   * @param {(KeyboardEvent | MouseEvent)} event
   * @param {Asset} item
   * @returns {void}
   */
  select(event: KeyboardEvent | MouseEvent, item: Asset): void {
    // this.handledByKeys = event instanceof KeyboardEvent;
    // if (this.handledByKeys) {
    //   let keyCode = (<KeyboardEvent>event).keyCode;
    //   if (keyCode === 27 && this.searching === 'inactive') {
    //     if (this.selection)
    //       this.selection = null;
    //     else
    //       this.focusBcIdx(this.path.length - 2);
    //   }
    //   if (keyCode === 8 && this.path.length > 1)
    //     $($(this.breadcrumbs.nativeElement).find('a')[this.path.length - 2]).focus();
    //   // Arrow key navigation
    //   if (this.filesContainer && keyCode >= 35 && keyCode <= 40) {
    //     let $filesContainer = $(this.filesContainer.nativeElement);
    //     let itemIdx = this.displayedFiles.indexOf(item);
    //     let maxIdxRow = Math.floor($filesContainer.outerWidth() / $(event.target).outerWidth());
    //     if (keyCode == 40 || keyCode == 38 || keyCode == 35 || keyCode == 36)
    //       event.preventDefault(); // no scroll
    //     switch(keyCode) {
    //       case 35: this.focusFileIdx(this.displayedFiles.length); break;
    //       case 36: this.focusFileIdx(0); break;
    //       case 37: this.focusFileIdx(itemIdx - 1); break;
    //       case 38: this.focusFileIdx(itemIdx - maxIdxRow); break;
    //       case 39: this.focusFileIdx(itemIdx + 1); break;
    //       case 40: this.focusFileIdx(itemIdx + maxIdxRow); break;
    //     }
    //   }
    //   if (keyCode !== 13) return;
    // }
    // if (item == this.selection)
    //   this.selection = null;
    // else
    //   this.selection = item;
    // this.selectEvent.emit(this.selection);
  }

  /**
   * Focuses the file view with the given index.
   *
   * @param {number} idx
   */
  focusFileIdx(idx: number) {
    if (this.filesContainer) {
      let $filesContainer = $(this.filesContainer.nativeElement);
      $($filesContainer.find('.p-2')[Math.min(this.displayedFiles.length - 1, Math.max(0, idx))]).focus();
    }
    else if (this.noFilesContainer)
      $(this.noFilesContainer.nativeElement).focus();
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.group) {
      this.assets = this.as.getAssets(this.group);
    }
    // if (changes.files) {
    //   setTimeout(() => this.filterFiles());
    //   this.selection = null;
    //   this.selectEvent.emit(this.selection);
    //   if (changes.path.previousValue) {
    //     let prevL = changes.path.previousValue.length;
    //     let prev = changes.path.previousValue[prevL - (prevL - changes.path.currentValue.length)];
    //     setTimeout(() => {
    //       if (this.filesContainer && this.handledByKeys) {
    //         let idx = this.displayedFiles.findIndex(val => val.name == prev);
    //         if (idx >= 0)
    //           $($(this.filesContainer.nativeElement).find('.p-2')[idx]).focus();
    //         else
    //           $(this.filesContainer.nativeElement).find('.p-2').first().focus();
    //       } else
    //         this.focusFileIdx(0);
    //     });
    //   }
    // }
  }

  /**
   * Breadcrumb click handler.
   *
   * @param {MouseEvent} event
   * @param {number} i
   */
  breadcrumbClick(event: MouseEvent, i: number) {
    // this.breadcrumbEvent.emit(i);
  }

  /**
   * Filters the current bound files.
   *
   * @param {KeyboardEvent} [event]
   * @returns {void}
   */
  filterFiles(event?: KeyboardEvent): void {
    // if (!this.assets) return;
    // if (this.searching == 'active' && this.search.nativeElement.value) {
    //   let val = this.search.nativeElement.value.toLocaleLowerCase();
    //   this.displayedFiles = this.assets.filter(child => child.name.toLocaleLowerCase().indexOf(val) >= 0 );
    // }
    // else
    //   this.displayedFiles = this.files;
    // // Keep the selection, even we filter
    // if (this.selection && this.displayedFiles.indexOf(this.selection) < 0)
    //   this.displayedFiles.push(this.selection);
  }

  /** @returns {void} Toggles the search mode. */
  toggleSearch(): void {
    this.searching == 'inactive' ? this.activateSearch() : this.cancelSearch();
  }

  /**
   * Search animation done handler.
   *
   * @param {AnimationTransitionEvent} event
   * @returns {void}
   */
  searchAnimDone(event: AnimationTransitionEvent): void {
    if (event.toState == 'active') {
      $(this.search.nativeElement).focus();
      this.filterFiles();
    } else if (event.toState == 'inactive') {
      this.filterFiles();
    }
  }

  /** @returns {void} Activates the search mode. */
  activateSearch() {
    $(this.search.nativeElement).removeAttr('disabled');
    if (this.searching == 'active')
      $(this.search.nativeElement).focus();
    this.searching = 'active';
  }

  /** @returns {void} Cancels the search mode. */
  cancelSearch() {
    this.searching = 'inactive';
    $(this.search.nativeElement).attr('disabled', 1);
  }

  /** @inheritdoc */
  ngAfterViewInit(): void {
    this.keyboardService.register('assets', this)
      .begin('assets')
      .bind('ctrl > f', () => this.activateSearch())
      .bind('esc', () => {
        if (this.searching === 'active') {
          this.cancelSearch();
          this.focusFileIdx(this.displayedFiles.indexOf(this.selection));
        }
      })
      .end();
  }

}
