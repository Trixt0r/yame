import { AssetComponentService } from '../service/asset-component';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

import * as path from 'path';

import { AssetService } from '../service/asset';
import { AssetGroup } from '../../../../common/asset/group';
import { Asset } from '../../../../common/asset';
import { MenuOption } from './assets/interface/menu-option';

const dragImage = new Image(0, 0);

/**
 * Assets component responsible for controling the assets view.
 *
 * The assets component gets assigned a certain asset group to display its asset members.
 *
 * @export
 * @class AssetsComponent
 * @implements {OnChanges}
 * @implements {AfterViewInit}
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'assets',
  templateUrl: 'assets.html',
  styleUrls: ['./assets.scss']
})
export class AssetsComponent implements OnChanges {

  /** @type {AssetGroup<Asset>} The group this component displays.*/
  @Input() group: AssetGroup<Asset>;

  assets: Asset[]; // The assets, we are displaying

  constructor(public ref: ElementRef, private as: AssetService, private assetComponents: AssetComponentService) {
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.group) {
      this.assets = this.as.getAssets(this.group);
    }
  }

  /**
   * Returns the menu options for the given asset.
   *
   * @param asset The asset to get the menu options for
   * @returns {MenuOption[]} The menu options for the given asset.
   */
  getMenuOptions(asset: Asset): MenuOption[] {
    return this.assetComponents.getMenuOptions(asset);
  }

  /**
   * Drag start handler.
   * Overrides the default drag image.
   *
   * @param {DragEvent} event
   * @returns {void}
   */
  dragStart(event: DragEvent): void {
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  }
}
