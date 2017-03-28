import { WorkspaceService } from '../../service/workspace';
import { Component, ElementRef } from '@angular/core';
import { AbstractComponent } from '../abstract';
import { ipcRenderer } from 'electron';
import * as _ from 'lodash';

@Component({
  templateUrl: 'assets.html',
  providers: [WorkspaceService]
})
export class AssetsComponent extends AbstractComponent {

  nodes = [ ];

  constructor(public ref: ElementRef, private ws: WorkspaceService) {
    super(ref);
  }

  openFolder() {
    let id = _.uniqueId('assets-');
    ipcRenderer.send('dialog:open', {properties: ['openDirectory']}, id );
    ipcRenderer.once(`dialog:open:${id}`, (event, files) => {
      if (files && files.length)
        this.ws.init(files[0]).then(json => this.nodes = json.children );
    });
  }
}