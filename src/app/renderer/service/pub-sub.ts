import { Injectable } from '@angular/core';
import PubSub from '../../common/pubsub';
import { EventEmitter } from "eventemitter3";

@Injectable()
export class PubSubService {

  get(): EventEmitter {
    return PubSub;
  }
}