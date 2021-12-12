import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { DestroyLifecycle, notify } from 'ng/modules/utils';
import { Observable, takeUntil } from 'rxjs';
import { AssetState, IAssetsSource, LoadFromAssetsSource } from '../../states';

@Component({
  selector: 'yame-asset-add-source',
  templateUrl: './add-source.component.html',
  styleUrls: ['./add-source.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyLifecycle],
})
export class AssetAddSourceComponent {
  @Input() mode: 'icon' | 'text' = 'icon';

  /**
   * Selector for subscribing to asset source updates.
   */
  @Select(AssetState.sources) assetSources$!: Observable<IAssetsSource[]>;

  /**
   * The currently available asset sources.
   */
  assetSources: IAssetsSource[] = [];

  @HostBinding('class')
  get display(): string {
    return this.mode === 'icon' ? 'icon' : 'text';
  }

  constructor(protected store: Store, destroy$: DestroyLifecycle, cdr: ChangeDetectorRef) {
    this.assetSources$.pipe(notify(cdr), takeUntil(destroy$)).subscribe((sources) => (this.assetSources = sources));
  }

  /**
   * Opens a dialog for opening a folder.
   *
   * @return `true` if a folder has been opened, `false` otherwise.
   */
  addFromSource(source: IAssetsSource): Observable<any> {
    return this.store.dispatch(new LoadFromAssetsSource(source));
  }
}
