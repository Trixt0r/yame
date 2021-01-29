import { APP_INITIALIZER, NgModule, NgZone } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResizableComponent } from './component/resizable';
import { ColorPipe } from './pipes/color.pipe';
import { PointInputComponent } from './components/point-input/point-input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NestedMenuItemComponent } from './components/nested-menu-item/nested-menu-item.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NumberDirective } from './directives/number.directive';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import { Select, Store } from '@ngxs/store';
import { SettingsState } from '../preferences/states/settings.state';
import { Observable } from 'rxjs';
import { UpdateSettingsValue } from '../preferences/states/actions/settings.action';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
      }
    }),
  ],
  declarations: [
    ResizableComponent,
    PointInputComponent,
    NestedMenuItemComponent,
    NumberDirective,
    ColorPipe
  ],
  exports: [
    HttpClientModule,
    TranslateModule,
    ResizableComponent,
    PointInputComponent,
    NestedMenuItemComponent,
    NumberDirective,
    ColorPipe,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, translate: TranslateService) => () => {
        const lng = translate.getBrowserLang();
        store.dispatch(new UpdateSettingsValue('language', lng));
      },
      deps: [ Store, TranslateService ],
      multi: true,
    }
  ]
})
export class UtilsModule {

  @Select(SettingsState.value('language')) language$!: Observable<string>;

  constructor(protected translate: TranslateService, zone: NgZone, store: Store) {
    translate.setDefaultLang('en');
    zone.runOutsideAngular(() => this.language$.subscribe(lng => this.setLang(lng)) );
  }

  /**
   *
   * @param lng
   */
  async setLang(lng: string) {
    await this.translate.use(lng).toPromise();
    try {
      const localeResults = await Promise.all([
        import(`@angular/common/locales/${lng}`)
          .catch(error => console.warn('[Utils] Could not load angular locales ', error)),
        import(`@angular/common/locales/extra/${lng}`)
          .catch(error => console.warn('[Utils] Could not load angular locale extras ', error))
      ]);
      if (localeResults.length > 0) registerLocaleData(localeResults[0].default, localeResults[1]?.default);
    } catch(error) {
      console.warn('[Utils] Could not load navigator language', error);
    }
  }
}
