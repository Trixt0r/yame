import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { Select, Store } from '@ngxs/store';
import { groupBy } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISettingsOption } from '../../interfaces/settings-option.interface';
import { ISettingsSection } from '../../interfaces/settings-section.interface';
import { SelectSettingsSection } from '../../states/actions/settings.action';
import { SettingsState } from '../../states/settings.state';

@Component({
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('sectionHeader') sectionHeader!: ElementRef<HTMLElement>;
  @ViewChild('listWrapper') listWrapper!: ElementRef<HTMLElement>;
  @ViewChildren('sections', { read: ElementRef }) sectionElements!: QueryList<ElementRef<HTMLElement>>;

  @Select(SettingsState.sections) sections$!: Observable<ISettingsSection[]>;
  @Select(SettingsState.options) options$!: Observable<ISettingsOption[]>;
  @Select(SettingsState.currentSection) currentSection$!: Observable<string>;

  sections: ISettingsSection[] = [];
  options: { [section: string]: ISettingsOption } = { };
  currentSection?: string;
  scrollingTimeout?: number;
  scrollingIntoSection = false;
  scrolledElement?: ElementRef<HTMLElement>;

  protected onResizeBound = this.onResize.bind(this);
  protected destroy$ = new Subject();

  constructor(protected store: Store, protected zone: NgZone, protected cdr: ChangeDetectorRef) {
    this.zone.runOutsideAngular(() => {
      this.sections$.pipe(takeUntil(this.destroy$)).subscribe(sections => {
        this.sections = sections;
        this.cdr.markForCheck();
      });
      this.options$.pipe(takeUntil(this.destroy$)).subscribe(options => {
        this.options = groupBy(options, option => option.section) as unknown as { [section: string]: ISettingsOption };
        this.cdr.markForCheck();
      });
      this.currentSection$.pipe(takeUntil(this.destroy$)).subscribe(section => {
        this.currentSection = section;
        this.cdr.markForCheck();
      });
    });
  }

  /**
   * Updates the list wrapper css, based on the height of header.
   */
  updateWrapper(): void {
    const headerHeight = this.sectionHeader.nativeElement.getBoundingClientRect().height;
    const computed = window.getComputedStyle(this.sectionHeader.nativeElement);
    const marginTop = parseInt(computed.getPropertyValue('margin-top'));
    const marginBottom = parseInt(computed.getPropertyValue('margin-bottom'));
    this.listWrapper.nativeElement.style.maxHeight = `calc(100% - ${(headerHeight + marginTop + marginBottom)}px)`;
  }

  /**
   * Scrolls the content view to the given section id.
   *
   * @param id The id of the section to scroll to.
   */
  scrollToSection(id: string): void {
    this.scrollingIntoSection = true;
    const sectionElement = this.sectionElements.find(it => it.nativeElement.id === id);
    this.scrolledElement = sectionElement;
    sectionElement?.nativeElement.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  /**
   * Handles the window resize event.
   */
  onResize(): void {
    this.updateWrapper();
  }

  /**
   * Handles section selection.
   *
   * @param change The triggered change.
   */
  onSectionSelect(change: MatSelectionListChange) {
    this.scrollToSection(change.options[0]?.value);
  }

  /**
   * Handles scroll events on the content.
   */
  onContentScroll() {
    let min = this.sectionElements.first?.nativeElement.id;
    let minVal = Math.abs(this.sectionElements.first?.nativeElement.getBoundingClientRect().top);
    this.sectionElements.forEach(it => {
      const top = it.nativeElement.getBoundingClientRect().top;
      const diff = Math.abs(top);
      if (top - 90 > 0 || diff >= minVal) return;
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
    this.updateWrapper();
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBound));
    if (this.currentSection && (!this.scrolledElement || this.scrolledElement.nativeElement.id !== this.currentSection))
      setTimeout(() => this.scrollToSection(this.currentSection!), 250);
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResizeBound);
    this.destroy$.next();
    this.destroy$.complete();
  }

}