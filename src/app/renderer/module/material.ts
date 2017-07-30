
import { NgModule } from '@angular/core';
import {
  MdButtonModule,
  MdCheckboxModule,
  MdGridListModule,
  MdCardModule,
  MdIconModule,
  MdMenuModule,
  MdListModule,
} from '@angular/material';

@NgModule({
  imports: [
    MdButtonModule,
    MdCheckboxModule,
    MdGridListModule,
    MdCardModule,
    MdIconModule,
    MdMenuModule,
    MdListModule,
  ],
  exports: [
    MdButtonModule,
    MdCheckboxModule,
    MdGridListModule,
    MdCardModule,
    MdIconModule,
    MdMenuModule,
    MdListModule,
  ],
})
export class MaterialModule { }