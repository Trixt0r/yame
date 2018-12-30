import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar/component';
import { UtilsModule } from "./utils";
import { MaterialModule } from './material';
import { HierarchyComponent } from './sidebar/component/hierarchy';
import { HierarchyService } from './sidebar/service/hierarchy';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule
  ],
  declarations: [
    SidebarComponent,
    HierarchyComponent,
  ],
  exports: [
    SidebarComponent,
    HierarchyComponent,
  ],
  providers: [HierarchyService]
})
export class SidebarModule { }
