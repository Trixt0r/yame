import { EventEmitter } from './event-emitter';

let emitter = new EventEmitter();

export let Pubsub = emitter;

export default emitter;
