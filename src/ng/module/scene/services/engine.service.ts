import { Injectable } from '@angular/core';
import { Engine } from '@trixt0r/ecs';
import { ofActionSuccessful, Actions } from '@ngxs/store';
import { CreateEntity, DeleteEntity, SortEntity, UpdateEntity } from '../states/actions';
import { SceneEntity } from 'common/scene';

@Injectable({ providedIn: 'root' })
export class EngineService {

  public readonly engine: Engine;

  public readonly diagnostics: { [label: string]: number | string | boolean } = { };

  protected lastRun: number = Date.now();
  protected engineOpts = { delta: 0 };
  protected requestId: number;

  constructor(actions: Actions) {
    this.engine = new Engine();
    actions.pipe(ofActionSuccessful(CreateEntity, DeleteEntity, UpdateEntity , SortEntity))
      .subscribe((action: CreateEntity | DeleteEntity | UpdateEntity | SortEntity) => {
        if (action instanceof CreateEntity)
          this.engine.entities.add.apply(this.engine.entities, action.created);
        else if (action instanceof DeleteEntity)
          this.engine.entities.remove.apply(this.engine.entities, action.deleted);
        else if (action instanceof SortEntity)
          this.engine.entities.sort((a: SceneEntity, b: SceneEntity) => {
            return Math.sign((a.components.byId('index').index as number) - (b.components.byId('index').index as number));
          });
        this.run();
      });
  }

  run(): void {
    if (this.requestId) return;
    this.requestId = requestAnimationFrame(() => {
      this.diagnostics.entities = this.engine.entities.length;
      const now = Date.now();
      this.engineOpts.delta = now - this.lastRun;
      this.diagnostics.startTime = performance.now();
      this.engine.run(this.engineOpts);
      this.lastRun = now;
      this.requestId = 0;
    });
  }

}
