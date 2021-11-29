import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { groupBy } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISettingsOption } from '../../interfaces/settings-option.interface';
import { ISettingsSection } from '../../interfaces/settings-section.interface';
import { SelectSettingsSection } from '../../states/actions/settings.action';
import { SettingsState } from '../../states/settings.state';

@Component({
  selector: 'yame-settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('sections', { read: ElementRef }) sectionElements!: QueryList<ElementRef<HTMLElement>>;

  @Select(SettingsState.sections) sections$!: Observable<ISettingsSection[]>;
  @Select(SettingsState.options) options$!: Observable<ISettingsOption[]>;
  @Select(SettingsState.currentSection) currentSection$!: Observable<string>;

  sections: ISettingsSection[] = [];
  options: { [section: string]: ISettingsOption } = {};
  currentSection?: string;
  scrollingTimeout?: number;
  scrollingIntoSection = false;
  scrolledElement?: ElementRef<HTMLElement>;

  protected destroy$ = new Subject<void>();

  constructor(protected store: Store, protected zone: NgZone, protected cdr: ChangeDetectorRef) {
    this.zone.runOutsideAngular(() => {
      this.sections$.pipe(takeUntil(this.destroy$)).subscribe((sections) => {
        this.sections = sections;
        this.cdr.markForCheck();
      });
      this.options$.pipe(takeUntil(this.destroy$)).subscribe((options) => {
        this.options = groupBy(options, (option) => option.section) as unknown as {
          [section: string]: ISettingsOption;
        };
        this.cdr.markForCheck();
      });
      this.currentSection$.pipe(takeUntil(this.destroy$)).subscribe((section) => {
        this.currentSection = section;
        this.cdr.markForCheck();
      });
    });
  }

  /**
   * Scrolls the content view to the given section id.
   *
   * @param id The id of the section to scroll to.
   */
  scrollToSection(id: string): void {
    this.scrollingIntoSection = true;
    const sectionElement = this.sectionElements.find((it) => it.nativeElement.id === id);
    this.scrolledElement = sectionElement;
    sectionElement?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Handles scroll events on the content.
   */
  onContentScroll(): void {
    let min = this.sectionElements.first?.nativeElement.id;
    let minVal = Math.abs(this.sectionElements.first?.nativeElement.getBoundingClientRect().top - 84);
    this.sectionElements.forEach((it) => {
      const top = it.nativeElement.getBoundingClientRect().top;
      const diff = Math.abs(top - 84);
      if (diff >= minVal) return;
      minVal = diff;
      min = it.nativeElement.id;
    });
    if (min === this.currentSection) return;
    const action = new SelectSettingsSection(min);
    if (this.scrollingIntoSection) {
      clearTimeout(this.scrollingTimeout);
      this.scrollingTimeout = setTimeout(() => {
        delete this.scrollingTimeout;
        this.scrollingIntoSection = false;
        this.store.dispatch(action);
      }, 60) as unknown as number;
    } else {
      this.store.dispatch(action);
    }
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    if (this.currentSection && (!this.scrolledElement || this.scrolledElement.nativeElement.id !== this.currentSection))
      setTimeout(() => this.scrollToSection(this.currentSection!), 250);
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
