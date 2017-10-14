
import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatGridListModule,
  MatCardModule,
  MatIconModule,
  MatMenuModule,
  MatListModule,
  MatDialogModule,
  MatProgressSpinnerModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  exports: [
    MatButtonModule,
    MatCheckboxModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
})
export class MaterialModule { }
