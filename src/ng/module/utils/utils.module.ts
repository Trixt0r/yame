import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResizableComponent } from './component/resizable';
import { ColorPipe } from './pipes/color';
import { PointInputComponent } from './components/point-input/point-input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NestedMenuItemComponent } from './components/nested-menu-item/nested-menu-item.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NumberDirective } from './directives/number.directive';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ResizableComponent,
    PointInputComponent,
    NestedMenuItemComponent,
    NumberDirective,
    ColorPipe
  ],
  exports: [
    ResizableComponent,
    PointInputComponent,
    NestedMenuItemComponent,
    NumberDirective,
    ColorPipe
  ],
})
export class UtilsModule {}
