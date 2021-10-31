import { v4 } from 'uuid';

declare function postMessage(data: string): void;

// const t = performance.now();
const tmp = [];

addEventListener('message', (message: MessageEvent) => {
  // const timeGone = performance.now() - t;
  const data = JSON.parse(message.data);
  const keys = Object.keys(data);
  for (let i = 0, l = keys.length; i < l; i++)
    tmp.push(v4());
  // console.log('received data', JSON.parse(message.data));
  postMessage('done');
});
