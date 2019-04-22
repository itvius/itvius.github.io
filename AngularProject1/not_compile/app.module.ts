import { BrowserModule } from '@angular/platform-browser';
import { NgModule} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {AppComponent, DialogOverviewExampleDialog} from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDialogModule
} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
      DialogOverviewExampleDialog
  ],
    entryComponents: [DialogOverviewExampleDialog],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
      MatSidenavModule,
      MatIconModule,
      MatToolbarModule,
      MatListModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      FormsModule,
      ReactiveFormsModule,
      MatCardModule,
      MatDialogModule
  ],
  providers: [DialogOverviewExampleDialog],
  bootstrap: [AppComponent]
})
export class AppModule { }
