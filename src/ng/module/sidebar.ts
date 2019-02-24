import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar/component';
import { UtilsModule } from './utils';
import { MaterialModule } from './material';
import { HierarchyComponent } from './sidebar/component/hierarchy';
import { HierarchyService } from './sidebar/service/hierarchy';
import { PropertiesComponent } from './sidebar/component/properties';
import { NgMathPipesModule } from 'angular-pipes';
import { PropertyService } from './sidebar/service/property';
import { ColorPropertyComponent } from './sidebar/component/property/color';
import { RangePropertyComponent } from './sidebar/component/property/range';
import { InputPropertyComponent } from './sidebar/component/property/input';
import { PropertyDirective } from './sidebar/directive/property';
import { NumberPropertyComponent } from './sidebar/component/property/number';

@NgModule({
  imports: [
    BrowserModule,
    UtilsModule,
    MaterialModule,
    NgMathPipesModule,
  ],
  entryComponents: [
    InputPropertyComponent,
    NumberPropertyComponent,
    ColorPropertyComponent,
    RangePropertyComponent,
  ],
  declarations: [
    SidebarComponent,
    HierarchyComponent,
    PropertyDirective,
    PropertiesComponent,
    InputPropertyComponent,
    NumberPropertyComponent,
    ColorPropertyComponent,
    RangePropertyComponent,
  ],
  exports: [
    SidebarComponent,
    HierarchyComponent,
    PropertyDirective,
    PropertiesComponent,
    InputPropertyComponent,
    NumberPropertyComponent,
    ColorPropertyComponent,
    RangePropertyComponent,
  ],
  providers: [HierarchyService, PropertyService],
})
export class SidebarModule {

  constructor(hierarchy: HierarchyService, property: PropertyService) {
    property.register('string', InputPropertyComponent);
    property.register('number', NumberPropertyComponent);
    property.register('color', ColorPropertyComponent);
    property.register('range', RangePropertyComponent);
  }

}
