import { AssetComponentService } from '../service/asset-component';
import { Component, ElementRef, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

import * as path from 'path';

import { AssetService } from '../service/asset';
import { AssetGroup } from '../../../../common/asset/group';
import { Asset } from '../../../../common/asset';
import { MenuOption } from './assets/interface/menu-option';

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
  moduleId: module.id,
  selector: 'assets',
  templateUrl: 'assets.html',
  styleUrls: ['./assets.scss']
})
export class AssetsComponent implements OnChanges {

  /** @type {AssetGroup<Asset>} The group this component displays.*/
  @Input() group: AssetGroup<Asset>;

  private assets: Asset[]; // The assets, we are displaying

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
}
