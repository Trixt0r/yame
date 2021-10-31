import { File } from './file';
import * as Promise from 'bluebird';
import { DirectoryContent } from 'common/content/directory';
import { Directory, ScanState } from './directory';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';

describe('Directory', () => {

  let emptyDir = path.resolve(os.tmpdir(), 'yame-empty-dir');
  let dirWithFile = path.resolve(os.tmpdir(), 'yame-dir-with-file');
  let dirWithFolders = path.resolve(os.tmpdir(), 'yame-dir-with-folders');
  let scanSpy;
  let subFolders = ['1', '2', '3'];

  beforeAll(() => Promise.all([
    fs.ensureDir(emptyDir),
    fs.ensureFile(path.resolve(dirWithFile, 'a.file')),
    fs.ensureDir(path.resolve(dirWithFolders, subFolders.join(path.sep)))
  ]));

  beforeEach(() => {
    scanSpy = { fn: function() { }};
    spyOn(scanSpy, 'fn');
  });

  it('should have a path', () => {
    let dir = new Directory(emptyDir);
    expect(dir.path).toBe(emptyDir);
  });

  it('should have a name', () => {
    let dir = new Directory(emptyDir);
    expect(dir.name).toBe(path.basename(emptyDir));
  });

  it('should have no children', () => {
    let dir = new Directory(emptyDir);
    expect(dir.children.length).toBe(0);
  });

  it('should export an object', () => {
    let dir = new Directory(emptyDir);
    expect(dir.export()).toBeTruthy();
  });

  it('should export the correct information', () => {
    let dir = new Directory(emptyDir);
    let exp = dir.export();
    let obj: DirectoryContent = {
      path: dir.path,
      name: dir.name,
      children: [],
      type: 'directory'
    };
    expect(exp).toEqual(jasmine.objectContaining(obj));
  });

  it('should not be scanned', () => {
    let dir = new Directory(emptyDir);
    expect(dir.isScanned).toBe(false);
  });

  it('should scan a directory', () => {
    let dir = new Directory(emptyDir);
    let state;
    return dir.scan(false, false)
            .then(s => state = s)
            .finally(() => expect(state).toBe(ScanState.DONE));
  });

  it('should be scanned', () => {
    let dir = new Directory(emptyDir);
    return dir.scan(false, false)
            .finally(() => expect(dir.isScanned).toBe(true));
  });

  it('should trigger the scan event', () => {
    let dir = new Directory(emptyDir);
    dir.on('scan', scanSpy.fn);
    return dir.scan(false, false)
            .finally(() => expect(scanSpy.fn).toHaveBeenCalled());
  });

  it('should trigger the scan:done event', () => {
    let dir = new Directory(emptyDir);
    dir.on('scan:done', scanSpy.fn);
    return dir.scan(false, false)
            .finally(() => expect(scanSpy.fn).toHaveBeenCalled());
  });

  it('should not force a second scan', () => {
    let dir = new Directory(emptyDir);
    return dir.scan(false, false)
            .finally(() => dir.scan(false, false).then(state => expect(state).toBe(ScanState.NOOP)));
  });

  it('should not force a second scan by default', () => {
    let dir = new Directory(emptyDir);
    return dir.scan()
            .finally(() => dir.scan().then(state => expect(state).toBe(ScanState.NOOP)));
  });

  it('should force a second scan', () => {
    let dir = new Directory(emptyDir);
    return dir.scan(false, false)
            .finally(() => dir.scan(true, false).then(state => expect(state).toBe(ScanState.DONE)));
  });

  it('should not be scanned if the path changes', () => {
    let dir = new Directory(emptyDir);
    return dir.scan(false, false)
            .finally(() => {
              dir.path = './any-path';
              expect(dir.isScanned).toBe(false);
            });
  });

  it('should trigger the change:path event', () => {
    let dir = new Directory(emptyDir);
    dir.on('change:path', scanSpy.fn);
    dir.path = './any-path';
    expect(scanSpy.fn).toHaveBeenCalled();
  });

  it('should scan a directory and have no children', () => {
    let dir = new Directory(emptyDir);
    return dir.scan(false, false)
            .finally(() => expect(dir.children.length).toBe(0));
  });

  it('should scan a directory and have a file', () => {
    let dir = new Directory(dirWithFile);
    return dir.scan(false, false)
            .finally(() => expect(dir.children[0] instanceof File).toBe(true));
  });

  it('should not have children if the path changes', () => {
    let dir = new Directory(emptyDir);
    return dir.scan(false, false)
            .finally(() => {
              dir.path = './any-path';
              expect(dir.children.length).toBe(0);
            });
  });

  it('should trigger the scan:file event', () => {
    let dir = new Directory(dirWithFile);
    dir.on('scan:file', scanSpy.fn);
    return dir.scan(false, false)
            .finally(() => expect(scanSpy.fn).toHaveBeenCalled());
  });

  it('should trigger the scan:file event and pass a file instance', () => {
    let dir = new Directory(dirWithFile);
    let file;
    dir.on('scan:file', f => file = f);
    return dir.scan(false, false)
            .finally(() => expect(file instanceof File).toBe(true));
  });

  it('should scan a directory and have a sub directory', () => {
    let dir = new Directory(dirWithFolders);
    return dir.scan(false, false)
            .finally(() => expect(dir.children[0] instanceof Directory).toBe(true));
  });

  it('should not scan the sub directory', () => {
    let dir = new Directory(dirWithFolders);
    return dir.scan(false, false)
            .finally(() => expect((<Directory>dir.children[0]).isScanned).toBe(false));
  });

  it('should scan the sub directory', () => {
    let dir = new Directory(dirWithFolders);
    return dir.scan(false, true)
            .finally(() => expect((<Directory>dir.children[0]).isScanned).toBe(true));
  });

  it('should scan the sub directory and have children in it', () => {
    let dir = new Directory(dirWithFolders);
    return dir.scan(false, true)
            .finally(() => expect((<Directory>dir.children[0]).children.length).toBe(1));
  });

  it('should trigger the scan:dir event', () => {
    let dir = new Directory(dirWithFolders);
    dir.on('scan:dir', scanSpy.fn);
    return dir.scan(false, true)
            .finally(() => expect(scanSpy.fn).toHaveBeenCalled());
  });

  it('should trigger the scan:dir event and pass a directory instance', () => {
    let dir = new Directory(dirWithFolders);
    let sub;
    dir.on('scan:dir', dir => sub = dir);
    return dir.scan(false, false)
            .finally(() => expect(sub instanceof Directory).toBe(true));
  });

  it('should fail', () => {
    let dir = new Directory(__dirname + '/no-path');
    let state;
    return dir.scan(false, false)
            .then(s => state = s)
            .finally(() => expect(state).toBe(ScanState.FAIL));
  });

  it('should trigger the scan:fail event', () => {
    let dir = new Directory(__dirname + '/no-path');
    dir.on('scan:fail', scanSpy.fn);
    return dir.scan(false, true)
            .finally(() => expect(scanSpy.fn).toHaveBeenCalled());
  });

  it('should sort files alphabetically', () => {
    let children = [
      new File(path.resolve(__dirname, 'b.file')),
      new File(path.resolve(__dirname, 'a.file'))
    ];
    Directory.sort(children);
    expect(children.findIndex(file => file.name === 'a.file'))
          .toBeLessThan(children.findIndex(file => file.name === 'b.file'));
  });

  it('should sort directories alphabetically', () => {
    let children = [
      new Directory(path.resolve(__dirname, 'b.dir')),
      new Directory(path.resolve(__dirname, 'a.dir'))
    ];
    Directory.sort(children);
    expect(children.findIndex(file => file.name === 'a.dir'))
          .toBeLessThan(children.findIndex(file => file.name === 'b.dir'));
  });

  it('should keep the order if the entities are already correctly sorted', () => {
    let children = [
      new Directory(path.resolve(__dirname, 'a.dir')),
      new Directory(path.resolve(__dirname, 'b.dir')),
    ];
    Directory.sort(children);
    expect(children.findIndex(file => file.name === 'a.dir'))
          .toBeLessThan(children.findIndex(file => file.name === 'b.dir'));
    });

  it('should sort directories to the beginning', () => {
    let children = [
      new File(path.resolve(__dirname, 'a.file')),
      new Directory(path.resolve(__dirname, 'b.dir'))
    ];
    Directory.sort(children);
    expect(children.findIndex(file => file.name === 'b.dir'))
          .toBeLessThan(children.findIndex(file => file.name === 'a.file'));
  });

  it('should keep the order if the directory is at the correct place', () => {
    let children = [
      new Directory(path.resolve(__dirname, 'b.dir')),
      new File(path.resolve(__dirname, 'a.file')),
    ];
    Directory.sort(children);
    expect(children.findIndex(file => file.name === 'b.dir'))
          .toBeLessThan(children.findIndex(file => file.name === 'a.file'));
  });

  afterAll(() => Promise.all([
    fs.remove(emptyDir),
    fs.remove(dirWithFile),
    fs.remove(dirWithFolders)
  ]));

});
