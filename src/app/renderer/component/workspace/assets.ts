import { KeyboardService } from '../../service/keyboard';
import { FileJSON } from '../../../common/io/file';
import { DirectoryJSON } from '../../../common/io/directory';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  AfterViewInit
} from '@angular/core';

import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

import { DomSanitizer } from '@angular/platform-browser';
import { AbstractComponent } from '../abstract';


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

  @Input() files: (DirectoryJSON | FileJSON)[];
  @Input() path: string;
  @Output() select = new EventEmitter();
  @Output() breadcrumb = new EventEmitter();
  @ViewChild('search') search: ElementRef;
  private searching = 'inactive';

  private displayedFiles: (DirectoryJSON | FileJSON)[];

  private selection: DirectoryJSON | FileJSON;

  constructor(public ref: ElementRef, private sanitizer: DomSanitizer, private keyboardService: KeyboardService) {
    super(ref);
  }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  click(event, item: DirectoryJSON | FileJSON) {
    if (item == this.selection)
      this.selection = null;
    else
      this.selection = item;
    this.select.emit(this.selection);
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.files) {
      setTimeout(() => this.filterFiles());
      this.selection = null;
      this.select.emit(this.selection);
    }
  }

  breadcrumbClick(event, i) {
    this.breadcrumb.emit(i);
  }

  filterFiles(event?: KeyboardEvent) {
    if (!this.files) return;
    if (this.searching == 'active' && this.search.nativeElement.value) {
      let val = this.search.nativeElement.value.toLocaleLowerCase();
      this.displayedFiles = this.files.filter(child => child.name.toLocaleLowerCase().indexOf(val) >= 0 );
    }
    else
      this.displayedFiles = this.files;
    // Keep the selection, even we filter
    if (this.selection && this.displayedFiles.indexOf(this.selection) < 0)
      this.displayedFiles.push(this.selection);
  }

  toggleSearch() {
    this.searching == 'inactive' ? this.activateSearch() : this.cancelSearch();
  }

  searchAnimDone(event) {
    if (event.toState == 'active') {
      $(this.search.nativeElement).focus();
      this.filterFiles();
    } else if (event.toState == 'inactive') {
      this.filterFiles();
    }
  }

  activateSearch() {
    if (this.searching == 'active')
      $(this.search.nativeElement).focus();
    this.searching = 'active';
  }

  cancelSearch() {
    this.searching = 'inactive';
  }

  /** @inheritdoc */
  ngAfterViewInit(): void {
    this.keyboardService.register('assets', this)
      .begin('assets')
      .bind('ctrl > f', () => this.activateSearch())
      .bind('esc', () => this.cancelSearch())
      .end();
  }

}