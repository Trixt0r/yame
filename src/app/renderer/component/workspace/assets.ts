import { FileJSON } from '../../../common/io/file';
import { DirectoryJSON } from '../../../common/io/directory';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AbstractComponent } from '../abstract';


@Component({
  moduleId: module.id,
  selector: 'assets',
  templateUrl: 'assets.html',
  styleUrls: ['assets.css'],
})
export class AssetsComponent extends AbstractComponent implements OnChanges {

  @Input() files: (DirectoryJSON | FileJSON)[];
  @Input() path: string;
  @Output() select = new EventEmitter();
  @Output() breadcrumb = new EventEmitter();

  private selection: DirectoryJSON | FileJSON;

  constructor(public ref: ElementRef, private sanitizer: DomSanitizer) {
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
      this.selection = null;
      this.select.emit(this.selection);
    }
  }

  breadcrumbClick(event, i) {
    this.breadcrumb.emit(i);
  }

  filterFiles(event) {
    console.log(event);
  }

}