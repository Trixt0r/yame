import { Injectable } from '@angular/core';
import { Collection, Engine } from '@trixt0r/ecs';
import { ofActionSuccessful, Actions } from '@ngxs/store';
import { CreateEntity, DeleteEntity, SortEntity, UpdateEntity } from '../states/actions/entity.action';
import { SceneEntity } from 'common/scene';

interface EngineOptions {
  delta?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class EngineService {

  public readonly engine: Engine;

  public readonly diagnostics: { [label: string]: number | string | boolean } = { };

  protected lastRun: number = Date.now();
  protected requestId?: number;
  public engineOpts: EngineOptions = { delta: 0 };
  protected tmpEngineOpts: EngineOptions | null = null;

  constructor(actions: Actions) {
    this.engine = new Engine();
    actions.pipe(ofActionSuccessful(CreateEntity, DeleteEntity, UpdateEntity , SortEntity))
      .subscribe((action: CreateEntity | DeleteEntity | UpdateEntity | SortEntity) => {
        if (action instanceof CreateEntity)
          this.engine.entities.add.apply(this.engine.entities, action.created);
        else if (action instanceof DeleteEntity)
          this.engine.entities.remove.apply(this.engine.entities, action.deleted);
        else if (action instanceof SortEntity)
          (this.engine.entities as Collection<SceneEntity>).sort((a: SceneEntity, b: SceneEntity) => {
            return Math.sign((a.components.byId('index')?.index as number) - (b.components.byId('index')?.index as number));
          });
        this.run();
      });
  }

  run(options?: EngineOptions): void {
    if (options) {
      if (!this.tmpEngineOpts) this.tmpEngineOpts = { };
      Object.assign(this.tmpEngineOpts, options);
    }
    if (this.requestId) return;
    this.requestId = requestAnimationFrame(() => {
      this.diagnostics.entities = this.engine.entities.length;
      const now = Date.now();
      this.engineOpts.delta = now - this.lastRun;
      this.diagnostics.startTime = performance.now();
      if (this.tmpEngineOpts) {
        Object.assign(this.tmpEngineOpts, this.engineOpts);
        this.engine.run(this.tmpEngineOpts);
      } else {
        this.engine.run(this.engineOpts);
      }
      this.lastRun = now;
      this.requestId = 0;
      this.tmpEngineOpts = null;
    });
  }

}
