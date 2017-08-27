
import { NgModule } from '@angular/core';
import {
  MdButtonModule,
  MdCheckboxModule,
  MdGridListModule,
  MdCardModule,
  MdIconModule,
  MdMenuModule,
  MdListModule,
  MdDialogModule,
  MdProgressSpinnerModule,
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
    MdDialogModule,
    MdProgressSpinnerModule,
  ],
  exports: [
    MdButtonModule,
    MdCheckboxModule,
    MdGridListModule,
    MdCardModule,
    MdIconModule,
    MdMenuModule,
    MdListModule,
    MdDialogModule,
    MdProgressSpinnerModule,
  ],
})
export class MaterialModule { }
