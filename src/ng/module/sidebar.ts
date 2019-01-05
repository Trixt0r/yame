import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar/component';
import { UtilsModule } from './utils';
import { MaterialModule } from './material';
import { HierarchyComponent } from './sidebar/component/hierarchy';
import { HierarchyService } from './sidebar/service/hierarchy';
import { PropertiesComponent } from './sidebar/component/properties';
import { NgMathPipesModule } from 'angular-pipes';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule,
    NgMathPipesModule,
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
  providers: [HierarchyService],
})
export class SidebarModule {}
