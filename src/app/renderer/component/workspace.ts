import { DirectoryJSON } from '../../common/io/directory';
import { FileJSON } from '../../common/io/file';
import { AssetsComponent } from './workspace/assets';
import { TreeNode } from 'angular-tree-component/dist/models/tree-node.model';
import { WindowRef } from '../service/window';
import { WorkspaceService } from '../service/workspace';
import { ResizeableComponent } from './utils/resizable';
import { AbstractComponent } from './abstract';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ipcRenderer } from 'electron';
import * as _ from 'lodash';
import * as path from 'path';

@Component({
  moduleId: module.id,
  selector: 'workspace',
  templateUrl: 'workspace.html',
  styleUrls: ['workspace.css'],
  providers: [WorkspaceService],
})
export class WorkspaceComponent extends ResizeableComponent {

  selectedPath: string[];

  nodes: (DirectoryJSON | FileJSON)[] = null;
  minWidth = 300;

  leftWidth = 200;
  rightWidth = 300;

  fixingSize = false;
  selection = null;

  @ViewChild('resizerLeft') resizerLeft: ResizeableComponent;
  @ViewChild('leftCol') leftCol: ElementRef;
  @ViewChild('midCol') midCol: AssetsComponent;
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
    let fullWidth = $(this.row.nativeElement).outerWidth(true);
    this.resizerLeft.maxVal = Math.min(Math.max(200, fullWidth - this.minWidth), fullWidth * .9);
    super.onResize();
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

  updateColumnsFromRight(width) {
    this.rightWidth = width;
    if (this.fixingSize) return;
    let diff = width - this.leftWidth;
    if (diff < this.minWidth) {
      this.fixingSize = true;
      this.resizerLeft.updateValue(this.resizerLeft.clampValue(width - this.minWidth));
      this.fixingSize = false;
    }
    this.updateColumns();
  }

  updateColumns() {
    let fullWidth = $(this.row.nativeElement).outerWidth(true);
    $(this.leftCol.nativeElement).css('width', this.leftWidth);
    $(this.leftCol.nativeElement).css('max-width', this.leftWidth);
    this.midCol.$el.css('left', this.leftWidth + 5);
    this.midCol.$el.css('max-width', fullWidth - this.leftWidth + 10);
    this.midCol.$el.css('width', fullWidth - this.leftWidth + 10);
  }

  select(event) {
    let node: TreeNode = event.node;

    console.log(node);

    this.selectedPath = node.data.path.replace(this.nodes[0].path, 'Assets').split(path.sep);

    this.selection = this.service.getFiles(node.data.path);
  }

  assetSelected(asset: DirectoryJSON | FileJSON) {
    if (!asset) return;

    if ((<DirectoryJSON>asset).children !== void 0) {
      let node = this.tree.treeModel.getNodeBy(node => node.data.path === asset.path);
      if (node) {
        node.parent.expand();
        node.expand();
        node.toggleActivated();
      }
    }
  }

  breadcrumbClick(i: number) {
    let tmp = this.selectedPath.slice(0, i + 1);
    tmp[0] = this.nodes[0].path;
    let p = tmp.join(path.sep);
    let node = this.tree.treeModel.getNodeBy(node => node.data.path === p);
    if (node) {
      node.parent.expand();
      node.expand();
      node.toggleActivated();
    }
  }

}