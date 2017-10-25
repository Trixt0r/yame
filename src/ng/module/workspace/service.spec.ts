import { ElectronService } from '../electron/service';
import { DirectoryProvider } from '../electron/provider/directory';
import { MockedService } from '../electron/provider/mocked-service';
import { WorkspaceService } from './service';

class EventHandler {
  fn() { };
}

describe('WorkspaceService', () => {

  let electron: ElectronService;
  let sendSpy: jasmine.Spy;
  let service: WorkspaceService;

  beforeEach(() => {
    electron = new MockedService();
    sendSpy = spyOn(electron.ipc, 'send');
    electron.registerProvider(DirectoryProvider);
    service = new WorkspaceService(electron);
  });

  describe('constructor', () => {
    it('should be in init state', () => {
      expect(service.state).toEqual('init', 'No in init state');
    });
  });

  describe('init', () => {

    let initSpy: jasmine.Spy;
    let readySpy: jasmine.Spy;
    let failSpy: jasmine.Spy;

    let initHandler: EventHandler;
    let readyHandler: EventHandler;
    let failHandler: EventHandler;

    beforeEach(() => {
      initHandler = new EventHandler();
      readyHandler = new EventHandler();
      failHandler = new EventHandler();
      initSpy = spyOn(initHandler, 'fn');
      readySpy = spyOn(readyHandler, 'fn');
      failSpy = spyOn(failHandler, 'fn');
      service.init$.subscribe(initHandler.fn);
      service.ready$.subscribe(readyHandler.fn);
      service.fail$.subscribe(failHandler.fn);
    });

    it('should return a promise', () => {
      expect(service.init('myDir') instanceof Promise).toBe(true, 'No promise returned');
    });
    it('should be in init state', () => {
      service.init('myDir');
      expect(service.state).toEqual('init', 'No in init state');
    });
    it('should emit the init event', () => {
      service.init('myDir');
      expect(initSpy.calls.all().length).toBe(1, 'Init event has not been emitted');
    });
    it('should be ready after the directory got scanned successfully', done => {
      setTimeout(() => {
        let id = sendSpy.calls.mostRecent().args[2];
        electron.ipc.emit(`directory:scan:${id}:done`, {} , { children: [] });
      }, 1);
      service.init('myDir').then(json => {
        expect(service.state).toEqual('ready', 'No in ready state');
        done();
      });
    });
    it('should emit the ready event after the directory got scanned successfully', done => {
      setTimeout(() => {
        let id = sendSpy.calls.mostRecent().args[2];
        electron.ipc.emit(`directory:scan:${id}:done`, {}, { children: [] });
      });
      service.init('myDir').then(json => {
        expect(readySpy.calls.all().length).toBe(1, 'Ready event has not been emitted');
        done();
      });
    });
    it('should be in fail state after the directory scan failed', done => {
      setTimeout(() => {
        let id = sendSpy.calls.mostRecent().args[2];
        electron.ipc.emit(`directory:scan:${id}:fail`, {}, { });
      });
      service.init('myDir').catch(e => {
        expect(service.state).toEqual('fail', 'No in fail state');
        done();
      });
    });
    it('should emit the fail event after the directory scan failed', done => {
      setTimeout(() => {
        let id = sendSpy.calls.mostRecent().args[2];
        electron.ipc.emit(`directory:scan:${id}:fail`, {}, { });
      });
      service.init('myDir').catch(e => {
        expect(failSpy.calls.all().length).toBe(1, 'Fail event has not been emitted');
        done();
      });
    });
    it('should have an error instance if the directory scan failed', done => {
      setTimeout(() => {
        let id = sendSpy.calls.mostRecent().args[2];
        electron.ipc.emit(`directory:scan:${id}:fail`, {}, { });
      });
      service.init('myDir').catch(e => {
        expect(service.error).toBeDefined('No error defined');
        done();
      });
    });
  });

  describe('find', () => {

    beforeEach(done => {
      service.init('myDir').then(done);

      let firstDir = {
        name: 'firstDir',
        path: 'myDir/firstDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }]
      };

      let id = sendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:done`, {}, {
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }, firstDir],
      });

    });

    it('should find the root group itself', () => {
      let found = service.find('myDir');
      expect(found).not.toBeNull('No root directory found');
      expect(found.type).toEqual('directory', 'Did not found a directory');
      expect(found.path).toEqual('myDir', 'Did not found the correct path');
    });
    it('should find the first file in the root', () => {
      let found = service.find('myDir/firstFile');
      expect(found).not.toBeNull('No file found');
      expect(found.type).toEqual('file', 'Did not found a file');
      expect(found.path).toEqual('myDir/firstFile', 'Did not found the correct path');
    });
    it('should find the first file in the first sub directory', () => {
      let found = service.find('myDir/firstDir/firstFile');
      expect(found).not.toBeNull('No file found');
      expect(found.type).toEqual('file', 'Did not found a file');
      expect(found.path).toEqual('myDir/firstDir/firstFile', 'Did not found the correct path');
    });
    it('should not find a file which is not a member of the root directory', () => {
      let found = service.find('randomFileNotInRootDir');
      expect(found).toBeNull('Found a file which is not member of the root directory');
    });
  });

  describe('getDirectories', () => {

    beforeEach(done => {
      service.init('myDir').then(done);

      let firstDir = {
        name: 'firstDir',
        path: 'myDir/firstDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }]
      };
      let secondDir = {
        name: 'secondDir',
        path: 'myDir/secondDir',
        type: 'directory',
        children: [{
          path: 'myDir/secondDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }]
      };

      let id = sendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:done`, {}, {
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }, firstDir, secondDir],
      });

    });

    it('should find all directories in the root folder', () => {
      let directories = service.getDirectories(service.directory);
      expect(directories).not.toBeNull('No directories found');
      directories.forEach(dir => {
        expect(dir.type).toEqual('directory', 'Found a false directory');
      });
      expect(directories.length).toBe(2, 'Incorrect amount of directories found');
    });
    it('should find no directories in the first sub folder', () => {
      let directories = service.getDirectories(service.directory);
      let found = service.getDirectories(directories[0]);
      expect(found.length).toBe(0, 'Sub directories found in first sub directory');
    });
  });

  describe('getFiles', () => {

    beforeEach(done => {
      service.init('myDir').then(done);

      let firstDir = {
        name: 'firstDir',
        path: 'myDir/firstDir',
        type: 'directory',
        children: []
      };

      let id = sendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:done`, {}, {
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }, {
          path: 'myDir/secondFile',
          name: 'secondFile',
          type: 'file'
        }, firstDir],
      });

    });

    it('should find all files in the root folder', () => {
      let files = service.getFiles(service.directory);
      expect(files).not.toBeNull('Files found');
      expect(files.length).toBe(3, 'Incorrect amount of files found');
    });
    it('should find all files in the root folder with a string as an argument', () => {
      let files = service.getFiles('myDir');
      expect(files).not.toBeNull('Files found');
      expect(files.length).toBe(3, 'Incorrect amount of files found');
    });
    it('should find no files in the first sub folder', () => {
      let directories = service.getDirectories(service.directory);
      let files = service.getFiles(directories[0]);
      expect(files).toBeDefined('No array defined');
      expect(files.length).toBe(0, 'Files found in first sub directory');
    });
    it('should return null if the argument is not a directory', () => {
      let files = service.getFiles('myDir/firstFile');
      expect(files).toBeNull('A file has been treated as a directory');
    });
  });

  describe('getParent', () => {

    beforeEach(done => {
      service.init('myDir').then(done);

      let id = sendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:done`, {}, {
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }],
      });
    });

    it('should find the parent of the first file in the root', () => {
      let parent = service.getParent('myDir/firstFile');
      expect(parent).not.toBeNull('No parent found');
      expect(parent.type).toBe('directory', 'The parent is not a directory');
      expect(parent.path).toBe('myDir', 'The wrong parent path has been found');
    });
    it('should not find a parent for the root directory', () => {
      let parent = service.getParent('myDir');
      expect(parent).toBeNull('Parent found');
    });
  });

  describe('getParents', () => {

    beforeEach(done => {
      service.init('myDir').then(done);

      let firstDir = {
        name: 'firstDir',
        path: 'myDir/firstDir',
        type: 'directory',
        children: [{
          path: 'myDir/firstFile',
          name: 'firstFile',
          type: 'file'
        }],
      };

      let id = sendSpy.calls.mostRecent().args[2];
      electron.ipc.emit(`directory:scan:${id}:done`, {}, {
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          name: 'firstDir',
          path: 'myDir/firstDir',
          type: 'directory',
          children: [{
            path: 'myDir/firstDir/firstFile',
            name: 'firstFile',
            type: 'file'
          }],
        }],
      });

    });

    it('should find all parents for the deepest file', () => {
      let parents = service.getParents('myDir/firstDir/firstFile');
      expect(parents).not.toBeNull('No parent found');
      parents.forEach(dir => {
        expect(dir.type).toEqual('directory', 'Found a false directory');
      });
      expect(parents.length).toBe(2, 'The wrong amount of parents has been returned');
    });
    it('should order the parent by hierarchy', () => {
      let parents = service.getParents('myDir/firstDir/firstFile');
      expect(parents[1]).toBe(service.getParents(parents[0])[0], 'The parents are not in hierarchical order');
    });
    it('should find only one parent for the first file in the root directory', () => {
      let parents = service.getParents('myDir/firstDir');
      expect(parents).not.toBeNull('No parent found');
      expect(parents[0].type).toEqual('directory', 'Found a false directory');
      expect(parents.length).toBe(1, 'The wrong amount of parents has been returned');
    });
  });

});
