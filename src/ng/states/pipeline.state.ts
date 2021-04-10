import { Injectable } from '@angular/core';

export interface Pipeline {
  name: string;

}

export interface IPipelineState {
  pipelines: Pipeline[];
}

@Injectable()
export class PipelineState {

}