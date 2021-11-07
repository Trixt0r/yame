import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolDirective } from './directives/tool.directive';
import { DefaultToolComponent } from './components/tool/default/default.component';
import { SelectionToolService } from './tools/selection';
import { NgxsModule, Store } from '@ngxs/store';
import { ToolbarState } from './states/toolbar.state';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { RegisterTool } from './states/actions/toolbar.action';
import { OverlayModule } from '@angular/cdk/overlay';
import { FormsModule } from '@angular/forms';
import { AddShortcut } from 'ng/states/hotkey.state';
import { HotkeyService } from 'ng/services/hotkey.service';
import { MatListModule } from '@angular/material/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    FormsModule,
    MatListModule,
    NzIconModule,
    NzButtonModule,
    NgxsModule.forFeature([ToolbarState]),
  ],
  declarations: [ToolbarComponent, DefaultToolComponent, ToolDirective],
  exports: [ToolbarComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, tool: SelectionToolService) => () => {
        store.dispatch([
          new RegisterTool(tool),
          new AddShortcut({ id: 'select.all', label: 'Select all', keys: [`${HotkeyService.commandOrControl}.a`] }),
        ]);
      },
      deps: [Store, SelectionToolService],
      multi: true,
    },
  ],
})
export class ToolbarModule {}
