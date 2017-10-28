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

/**
 * The workspace component represents the workspace.
 *
 * It holds the groups component and the assets component.
 * The workspace component is meant to linke the groups and assets component.
 * The assets component renders always the content of the currently selected asset group.
 *
 * @export
 * @class WorkspaceComponent
 * @extends {ResizeableComponent}
 */
@Component({
  moduleId: module.id,
  selector: 'workspace',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
})
export class WorkspaceComponent extends ResizeableComponent {

  /**
   * @type {((DirectoryContent | FileContent)[])} All currently loaded content.
   */
  content: (DirectoryContent | FileContent)[] = null;

  /**
   * @type {number} The minimum width for each column.
   */
  minWidth = 300;

  /**
   * @type {AssetGroup<Asset>} The currently selected asset group.
   */
  assetGroup: AssetGroup<Asset>;

  /**
   * @type {ResizeableComponent} The resizer between both inner components.
   */
  @ViewChild('resizer') resizer: ResizeableComponent;

  /**
   * @type {GroupsComponent} The groups component, on the left.
   */
  @ViewChild('groupsComponent') groupsComponent: GroupsComponent;

  /**
   * @type {AssetsComponent} The assets component, on the right.
   */
  @ViewChild('assetsComponent') assetsComponent: AssetsComponent;

  /**
   * @type {ElementRef} The row, which is wrapped around all inner components.
   */
  @ViewChild('row') row: ElementRef;

  constructor(public ref: ElementRef,
              private service: WorkspaceService,
              private assets: AssetService,
              private electron: ElectronService) {
    super(ref);
    this.maxVal = window.innerHeight - 100;
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerHeight - 100;
    if (this.row) {
      let fullWidth = this.row.nativeElement.offsetWidth;
      this.resizer.maxVal = Math.max(200, fullWidth - (this.minWidth + 15));
    }
    super.onResize();
    if (this.resizer) {
      this.resizer.onResize();
      this.updateColumns(this.resizer.propertyValue);
    }
  }

  /**
   * Opens a dialog for opening a folder.
   *
   * @returns {Promise<boolean>} Resolves `true` if a folder has been opened. `false otherwise`.
   */
  openFolder() {
    let provider = this.electron.getProvider(DialogProvider);
    return provider.open({ properties: ['openDirectory'] })
      .then(files => {
        return this.service.init(files[0]).then(json => {
          this.content = <any>[{
            name: 'Assets',
            path: json.path,
            isExpanded: true,
            children: this.service.directories
          }];
          return this.assets.fromFs(json)
                  .then(group => this.onGroupSelect(<AssetGroup<Asset>>group))
                  .then(() => setTimeout(() => this.onResize()))
                  .then(() => true);
        });
      })
      .catch(e =>false);
  }

  /**
   * Update the size of the columns.
   * @param {number} size
   * @returns {boolean} `true` if the size has been applied, `false` otherwise.
   */
  updateColumns(size: number) {
    if (!this.row) return false;
    let fullWidth = this.row.nativeElement.offsetWidth;
    this.groupsComponent.ref.nativeElement.style.width = `${size}px`;
    this.groupsComponent.ref.nativeElement.style['max-width'] = `${size}px`;
    this.assetsComponent.ref.nativeElement.style.left = `${size + 5}px`;
    this.assetsComponent.ref.nativeElement.style['max-width'] = `${fullWidth - size - 5}px`;
    this.assetsComponent.ref.nativeElement.style.width = `${fullWidth - size - 5}px`;
    return true
  }

  /**
   * Handles the group selection by the user.
   *
   * @param {AssetGroup<Asset>} group The selected group.
   */
  onGroupSelect(group: AssetGroup<Asset>) {
    this.assetGroup = group;
  }
}
