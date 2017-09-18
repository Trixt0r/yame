import { File } from './file';
import fs from './fs';
import * as os from 'os';
import * as path from 'path';

describe('File', () => {

  let readData = JSON.stringify({ foo: 'bar' });
  let readFilePath = path.resolve(os.tmpdir(), 'yame-file.spec.read.json');
  let spy = {fn: function() { } };

  beforeAll(() => {
    spyOn(spy, 'fn');
    return fs.writeFileAsync(readFilePath, readData)
  });

  it('should not point to any path', () => {
    expect(new File().path).toBeUndefined();
  });

  it('should point to the correct path', () => {
    expect(new File(readFilePath).path).toBe(readFilePath);
  });

  it('should have the correct file name', () => {
    expect(new File(readFilePath).name).toBe('yame-file.spec.read.json');
  });

  it('should have the correct simple file name', () => {
    expect(new File(readFilePath).simpleName).toBe('yame-file.spec.read');
  });

  it('should have the correct file type', () => {
    expect(new File(readFilePath).type).toBe('json');
  });

  it('should contain the correct data', () => {
    return new File(readFilePath).read().then(buffer => expect(buffer.toString()).toBe(readData));
  });

  it('should not have a last modified timestamp', () => {
    let file = new File(readFilePath);
    return file.read(void 0, false).then(() => expect(file.lastModified).toBeFalsy());
  });

  it('should not have a size', () => {
    let file = new File(readFilePath);
    return file.read(void 0, false).then(() => expect(file.lastModified).toBeFalsy());
  });

  it('should have a last modified timestamp', () => {
    let file = new File(readFilePath);
    return file.read(void 0, true).then(() => expect(file.lastModified).toBeTruthy());
  });

  it('should have a size', () => {
    let file = new File(readFilePath);
    return file.read(void 0, true).then(() => expect(file.lastModified).toBeTruthy());
  });

  it('should export an object', () => {
    let file = new File(readFilePath);
    expect(file.export()).toBeTruthy();
  });

  it('should export the correct information', () => {
    let file = new File(readFilePath);
    return file.read(void 0, true).then(() => {
      let exp = file.export();
      expect(exp).toEqual(jasmine.objectContaining({
        lastModified: file.lastModified,
        name: file.name,
        path: file.path,
        simpleName: file.simpleName,
        size: file.size,
        type: file.type
      }));
    });
  });

  it('should write any given data to fs', () => {
    let writeFilePath = path.resolve(os.tmpdir(), 'yame-file.spec.write.json');
    let file = new File(writeFilePath);
    return file.write(JSON.stringify({bar: 'foo'}))
      .then(() => {
        return fs.accessAsync(writeFilePath).then(spy.fn)
      })
      .finally(() => expect(spy.fn).toHaveBeenCalled())
      .then(() => fs.unlinkAsync(writeFilePath));
  });

  afterAll(() => fs.unlinkAsync(readFilePath));
});
