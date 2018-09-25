declare function postMessage(data: string);
import * as uuidv4 from 'uuid/v4';
// const t = performance.now();
const tmp = [];

addEventListener('message', (message: MessageEvent) => {
  // const timeGone = performance.now() - t;
  const data = JSON.parse(message.data);
  const keys = Object.keys(data);
  for (let i = 0, l = keys.length; i < l; i++)
    tmp.push(uuidv4());
  // console.log('received data', JSON.parse(message.data));
  postMessage('done');
});
