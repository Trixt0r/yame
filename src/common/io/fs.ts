import * as Promise from 'bluebird';
import * as fs from 'fs';

declare module 'fs' {
  export function accessAsync(path: string | Buffer): Promise<string[]>;
  export function readdirAsync(path: string | Buffer): Promise<string[]>;
  export function readFileAsync(filename: string, encoding?: string): Promise<string | Buffer>;
  export function writeFileAsync(filename: string, data: any): Promise<void>;
}

Promise.promisifyAll(fs);

export default fs;
