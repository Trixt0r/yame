import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar/component';
import { UtilsModule } from "./utils";
import { MaterialModule } from './material';
import { HierarchyComponent } from './sidebar/component/hierarchy';
import { HierarchyService } from './sidebar/service/hierarchy';
import { PropertiesComponent } from './sidebar/component/properties';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule
  ],
  declarations: [
    SidebarComponent,
    HierarchyComponent,
    PropertiesComponent,
  ],
  exports: [
    SidebarComponent,
    HierarchyComponent,
    PropertiesComponent,
  ],
  providers: [HierarchyService]
})
export class SidebarModule { }
