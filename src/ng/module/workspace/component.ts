import { DialogProvider } from '../electron/provider/dialog';
import { ElectronService } from '../electron/service';
import { AssetGroup } from '../../../common/asset/group';
import { DirectoryAsset } from '../../../common/asset/directory';
import { AssetService } from './service/asset';
import { GroupsComponent } from './component/groups';
import { ResizeableComponent } from "../utils/component/resizable";
import { AssetsComponent } from './component/assets';
import { WindowRef } from '../../service/window';
import { WorkspaceService } from './service';
import { Component, ElementRef, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import * as path from 'path';
import { DirectoryContent } from "../../../common/content/directory";
import { FileContent } from "../../../common/content/file";
import { Asset } from "../../../common/asset";

@Component({
  moduleId: module.id,
  selector: 'workspace',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
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

  assetGroup: AssetGroup<Asset>;

  @ViewChild('resizerLeft') resizerLeft: ResizeableComponent;
  @ViewChild('leftCol') leftCol: GroupsComponent;
  @ViewChild('rightCol') rightCol: AssetsComponent;
  @ViewChild('row') row: ElementRef;
  @ViewChild('tree') tree: any;

  constructor(public ref: ElementRef, private service: WorkspaceService, private assets: AssetService, private electron: ElectronService) {
    super(ref);
    this.maxVal = window.innerHeight - 100;
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerHeight - 100;
    if (this.row) {
      let fullWidth = this.row.nativeElement.offsetWidth;
      this.resizerLeft.maxVal = Math.min(Math.max(200, fullWidth - this.minWidth), fullWidth - 315);
    }
    super.onResize();
    if (this.resizerLeft)
      this.resizerLeft.onResize();
    this.updateColumns();
  }

  openFolder() {
    let provider = this.electron.getProvider(DialogProvider);
    return provider.open({ properties: ['openDirectory'] })
      .then(files => {
        if (files && files.length)
          this.service.init(files[0]).then(json => {
            this.nodes = <any>[{
              name: 'Assets',
              path: json.path,
              isExpanded: true,
              children: this.service.directories
            }];
            this.onGroupSelect(<AssetGroup<Asset>>this.assets.fromFs(json));
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
    let fullWidth = this.row.nativeElement.offsetWidth;
    this.leftCol.ref.nativeElement.style.width = `${this.leftWidth}px`;
    this.leftCol.ref.nativeElement.style['max-width'] = `${this.leftWidth}px`;
    this.rightCol.ref.nativeElement.style.left = `${this.leftWidth + 5}px`;
    this.rightCol.ref.nativeElement.style['max-width'] = `${fullWidth - this.leftWidth - 5}px`;
    this.rightCol.ref.nativeElement.style.width = `${fullWidth - this.leftWidth - 5}px`;
  }

  onGroupSelect(group: AssetGroup<Asset>) {
    this.assetGroup = group;
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
