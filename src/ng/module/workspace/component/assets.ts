import { AssetComponentService } from '../service/asset-component';
import { Component, ElementRef, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

import * as path from 'path';

import { AssetService } from '../service/asset';
import { AssetGroup } from '../../../../common/asset/group';
import { Asset } from '../../../../common/asset';
import { AbstractComponent } from "../../../component/abstract";
import { MenuOption } from './assets/interface/menu-option';

/**
 * Assets component responsible for controling the assets view.
 *
 * The assets component gets assigned a certain asset group to display its asset members.
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
  styleUrls: ['./assets.scss'],
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
export class AssetsComponent extends AbstractComponent implements OnChanges {

  /** @type {AssetGroup<Asset>} The group this component displays.*/
  @Input() group: AssetGroup<Asset>;

  private assets: Asset[]; // The assets, we are displaying

  getMenuOptions(asset: Asset): MenuOption[] {
    return this.assetComponents.getMenuOptions(asset);
  }

  constructor(public ref: ElementRef, private as: AssetService, private assetComponents: AssetComponentService) {
    super(ref);
    // this.menuOptions.push({
    //   icon: 'edit',
    //   title: 'Edit',
    //   callback: (event, asset) => alert('edit' + asset.id)
    // }, {
    //   icon: 'content_copy',
    //   title: 'Copy',
    //   callback: (event, asset) => alert('Copy' + asset.id)
    // }, {
    //   icon: 'folder',
    //   title: 'aaaaa',
    //   callback: (event, asset) => alert('aaaaa' + asset.id)
    // });
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.group) {
      this.assets = this.as.getAssets(this.group);
    }
  }


  // menuClick(event: MouseEvent, asset: Asset, option: MenuOption) {
  //   console.log(event, asset);
  // }
}
