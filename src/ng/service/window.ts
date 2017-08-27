import { Injectable } from '@angular/core';

function getWindow() : Window {
   // return the global native browser window object
   return window;
}

@Injectable()
export class WindowRef {
   get nativeWindow() : Window {
      return getWindow();
   }
}