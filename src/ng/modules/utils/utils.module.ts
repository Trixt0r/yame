import { APP_INITIALIZER, NgModule, NgZone } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ColorPipe } from './pipes/color.pipe';
import { PointInputComponent } from './components/point-input/point-input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NestedDropdownComponent } from './components/nested-dropdown/nested-dropdown.component';
import { NumberDirective } from './directives/number.directive';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Select, Store } from '@ngxs/store';
import { SettingsState } from '../preferences/states/settings.state';
import { Observable } from 'rxjs';
import { InitDefaultSettingsValue } from '../preferences/states/actions/settings.action';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ResizableComponent, TypeLabelComponent } from './components';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    NzDropDownModule,
    NzInputModule,
    NzFormModule,
    NzIconModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [
    ResizableComponent,
    PointInputComponent,
    NestedDropdownComponent,
    NumberDirective,
    ColorPipe,
    TypeLabelComponent,
  ],
  exports: [
    HttpClientModule,
    TranslateModule,
    ResizableComponent,
    PointInputComponent,
    NestedDropdownComponent,
    NumberDirective,
    ColorPipe,
    TypeLabelComponent,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, translate: TranslateService) => () => {
        const lng = translate.getBrowserLang() ?? navigator.language;
        store.dispatch(new InitDefaultSettingsValue('language', lng));
      },
      deps: [Store, TranslateService],
      multi: true,
    },
  ],
})
export class UtilsModule {
  @Select(SettingsState.value('language')) language$!: Observable<string>;

  constructor(protected translate: TranslateService, zone: NgZone) {
    translate.setDefaultLang('en');
    zone.runOutsideAngular(() => this.language$.subscribe((lng) => this.setLang(lng)));
  }

  /**
   * Sets the current language to the given value.
   *
   * @param lng
   */
  async setLang(lng: string) {
    if (!lng) return;
    await this.translate.use(lng).toPromise();
    try {
      await import(
        /* webpackInclude: /(de|en|es|fr|it|nl|no|pl|pt-BR|pt|fi|sv|ko|ru|zh|zh-Hans|zh-Hant|ja)\.js/ */
        /* webpackMode: "lazy-once" */
        `/node_modules/@angular/common/locales/global/${lng}`
      );
    } catch (error) {
      console.warn('[Utils] Could not load navigator language', error);
    }
  }
}
