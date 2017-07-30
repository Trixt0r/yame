import { GroupsComponent } from './component/groups';
import { ResizeableComponent } from "../utils/component/resizable";
import { AssetsComponent } from './component/assets';
import { TreeNode } from 'angular-tree-component/dist/models/tree-node.model';
import { WindowRef } from '../../service/window';
import { WorkspaceService } from './service';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ipcRenderer } from 'electron';
import * as _ from 'lodash';
import * as path from 'path';
import { DirectoryContent } from "../../../common/content/directory";
import { FileContent } from "../../../common/content/file";

@Component({
  moduleId: module.id,
  selector: 'workspace',
  templateUrl: 'component.html',
  styleUrls: ['component.css'],
  providers: [WorkspaceService],
})
export class WorkspaceComponent extends ResizeableComponent {

  selectedPath: string[];

  nodes: (DirectoryContent | FileContent)[] = null;
  minWidth = 300;

  leftWidth = 200;
  rightWidth = 300;

  fixingSize = false;
  selection = null;
  nextSelection = null;

  @ViewChild('resizerLeft') resizerLeft: ResizeableComponent;
  @ViewChild('leftCol') leftCol: GroupsComponent;
  @ViewChild('rightCol') rightCol: AssetsComponent;
  @ViewChild('row') row: ElementRef;
  @ViewChild('tree') tree: any;

  constructor(public ref: ElementRef, private service: WorkspaceService, private sanitizer: DomSanitizer) {
    super(ref);
    this.maxVal = window.innerHeight - 100;
  }

  sanitizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerHeight - 100;
    if (this.row) {
      let fullWidth = $(this.row.nativeElement).outerWidth(true);
      this.resizerLeft.maxVal = Math.min(Math.max(200, fullWidth - this.minWidth), fullWidth - 315);
    }
    super.onResize();
    if (this.resizerLeft)
      this.resizerLeft.onResize();
    this.updateColumns();
  }

  openFolder() {
    let id = _.uniqueId('assets-');
    ipcRenderer.send('dialog:open', {properties: ['openDirectory']}, id );
    ipcRenderer.once(`dialog:open:${id}`, (event, files) => {
      if (files && files.length)
        this.service.init(files[0]).then(json => {
          this.nodes = <any>[{
            name: 'Assets',
            path: json.path,
            isExpanded: true,
            children: this.service.directories
          }];
          this.select(json.path);
          setTimeout(() => this.onResize());
        });
    });
  }

  updateColumnsFromLeft(width) {
    this.leftWidth = width;
    if (this.fixingSize) return;
    let diff = this.rightWidth - width;
    if (diff < this.minWidth) {
      this.fixingSize = true;
      this.fixingSize = false;
    }
    this.updateColumns();
  }

  updateColumns() {
    if (!this.row) return;
    let fullWidth = $(this.row.nativeElement).outerWidth(true);
    this.leftCol.$el.css('width', this.leftWidth);
    this.leftCol.$el.css('max-width', this.leftWidth);
    this.rightCol.$el.css('left', this.leftWidth + 5);
    this.rightCol.$el.css('max-width', fullWidth - this.leftWidth - 5);
    this.rightCol.$el.css('width', fullWidth - this.leftWidth - 5);
  }

  select(filePath: string) {
    this.selectedPath = filePath.replace(this.nodes[0].path, 'Assets').split(path.sep);
    this.selection = this.service.getFiles(filePath);
  }

  assetSelected(asset: DirectoryContent | FileContent) {
    // TODO: implement this
  }

  breadcrumbClick(i: number) {
    let tmp = this.selectedPath.slice(0, i + 1);
    tmp[0] = this.nodes[0].path;
    let p = tmp.join(path.sep);
  }

}
