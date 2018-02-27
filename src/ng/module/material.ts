
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
  MatToolbarModule,
  MatRippleModule,
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
    MatToolbarModule,
    MatRippleModule,
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
    MatToolbarModule,
    MatRippleModule,
  ],
})
export class MaterialModule { }
