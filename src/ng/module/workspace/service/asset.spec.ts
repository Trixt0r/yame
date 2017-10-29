import { AssetGroup } from '../../../../common/asset/group';
import { DirectoryAsset } from '../../../../common/asset/directory';
import { FileContent } from '../../../../common/content/file';
import { FileAsset } from '../../../../common/asset/file';
import { AssetService } from './asset';
import convertDirectory from './converter/directory';

class MyFileAsset extends FileAsset { }

describe('AssetService', () => {

  let service: AssetService;
  let myTypeConverter = content => Promise.resolve(new MyFileAsset());

  let fileContent: FileContent = {
    name: 'myFile.test',
    simpleName: 'myFile',
    path: '/myFile.test',
    type: 'test'
  };

  beforeEach(() => {
    service = new AssetService();
  });

  describe('registerFsConverter & getFsConverter', () => {
    it('should register an fs converter', () => {
      service.registerFsConverter('myType', myTypeConverter);
      expect(service.getFsConverter('myType')).toBeDefined('No fs converter defined for "myType"');
      expect(service.getFsConverter('myType')).toBe(myTypeConverter, 'myTypeConverter has not been assigned');
    });

    it('should override an fs converter', () => {
      let newFsConverter = content => Promise.resolve(new FileAsset());
      service.registerFsConverter('myType', myTypeConverter);
      expect(service.getFsConverter('myType')).toBe(myTypeConverter, 'myTypeConverter has not been assigned');
      service.registerFsConverter('myType', newFsConverter);
      expect(service.getFsConverter('myType')).toBe(newFsConverter, 'fs converter has not been overriden');
    });

    it('should not have a defined fs converter for an unknown type', () => {
      expect(service.getFsConverter('unknown')).toBeUndefined('A fs converter for "unknown" is defined');
    });
  });

  describe('fromFs', () => {
    it('should return a promise', () => expect(service.fromFs(fileContent) instanceof Promise).toBe(true, 'The returned value is not a promise') );

    it('should convert any unknown file to a file asset', done => {
      service.fromFs(fileContent)
        .then(asset => expect(asset instanceof FileAsset).toBe(true, 'A file asset has not been created'))
        .then(done);
    });

    it('should convert a known file via the registered converter', done => {
      service.registerFsConverter('test', myTypeConverter);
      service.fromFs(fileContent)
        .then(asset => expect(asset instanceof MyFileAsset).toBe(true, 'my file asset has not been created'))
        .then(done);
    });

    it('should get the result from the cache on the second run', done => {
      service.fromFs(fileContent)
        .then(asset => {
          return service.fromFs(fileContent)
            .then(re => expect(re).toBe(asset, 'The content has not been cached'))
            .then(done)
        });
    });

    it('should not get the result from the cache on the second run if caching is not forced', done => {
      service.fromFs(fileContent)
        .then(asset => {
          return service.fromFs(fileContent, false)
            .then(re => expect(re).not.toBe(asset, 'The content has been cached'))
            .then(done);
        });
    });
  });

  describe('toFileAsset', () => {
    it('should return an instance of FileAsset', done => {
      service.toFileAsset(fileContent)
        .then(asset => expect(asset instanceof FileAsset).toBe(true, 'A FileAsset instance has not been created'))
        .then(done);
    });
  });

  describe('getGroups', () => {
    let directory: DirectoryAsset;

    beforeEach(done => {
      service.registerFsConverter('directory', convertDirectory);
      service.fromFs(<any>{
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          name: 'firstDir',
          path: 'myDir/firstDir',
          type: 'directory',
          children: [],
        },{
          path: 'myDir/2nDir',
          name: '2nDir',
          type: 'directory',
          children: []
        },
        {
          path: 'myDir/file1',
          name: 'file1',
          type: 'file',
        },
        {
          path: 'myDir/file2',
          name: 'file2',
          type: 'file',
        },
        {
          path: 'myDir/file3',
          name: 'file3',
          type: 'file',
        }]
      }).then(dir => directory = <any>dir).then(done);
    });

    it('should return the correct amount of asset groups (2)', () => {
      let result = service.getGroups(directory);
      expect(result.length).toBe(2, '2 groups have not been returned');
    });

    it('should return an empty result for assets without members', () => {
      let result = service.getGroups(<any>{});
      expect(result.length).toBe(0, 'groups have been returned');
    });
  });

  describe('getAssets', () => {
    let directory: DirectoryAsset;

    beforeEach(done => {
      service.registerFsConverter('directory', convertDirectory);
      service.fromFs(<any>{
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          name: 'firstDir',
          path: 'myDir/firstDir',
          type: 'directory',
          children: [],
        },{
          path: 'myDir/2nDir',
          name: '2nDir',
          type: 'directory',
          children: []
        },
        {
          path: 'myDir/file1',
          name: 'file1',
          type: 'file',
        },
        {
          path: 'myDir/file2',
          name: 'file2',
          type: 'file',
        },
        {
          path: 'myDir/file3',
          name: 'file3',
          type: 'file',
        }]
      }).then(dir => directory = <any>dir).then(done);
    });

    it('should return the correct amount of non asset groups (3)', () => {
      let result = service.getAssets(directory);
      expect(result.length).toBe(3, '3 non-asset-groups have not been returned');
    });

    it('should return an empty result for assets without members', () => {
      let result = service.getAssets(<any>{});
      expect(result.length).toBe(0, 'non-asset-groups have been returned');
    });
  });

  describe('getParents', () => {
    let directory: DirectoryAsset;

    beforeEach(done => {
      service.registerFsConverter('directory', convertDirectory);
      service.fromFs(<any>{
        name: 'myDir',
        path: 'myDir',
        type: 'directory',
        children: [{
          name: 'firstDir',
          path: 'myDir/firstDir',
          type: 'directory',
          children: [{
            path: 'myDir/firstDir/firstDir',
            name: 'firstDir',
            type: 'directory',
            children: []
          }],
        }],
      }).then(dir => directory = <any>dir).then(done);
    });

    it('should find all parents for the deepest asset', () => {
      let parents = service.getParents((<any>directory.members[0]).members[0]);
      expect(parents).not.toBeNull('No array returned');
      parents.forEach(dir => {
        expect((dir instanceof AssetGroup)).toBe(true, 'Found a false group');
      });
      expect(parents.length).toBe(2, 'The wrong amount of parents has been returned');
    });

    it('should order the parent by hierarchy', () => {
      let parents = service.getParents((<any>directory.members[0]).members[0]);
      expect(parents[1]).toBe(service.getParents(parents[0])[0], 'The parents are not in hierarchical order');
    });

    it('should find only one parent for the first asset in the group hierarchy', () => {
      let parents = service.getParents(directory.members[0]);
      expect(parents).not.toBeNull('No array returned');
      expect(parents[0] instanceof AssetGroup).toBe(true, 'Found a false group');
      expect(parents.length).toBe(1, 'The wrong amount of parents has been returned');
    });

    it('should find no parent for the root group', () => {
      let parents = service.getParents(directory);
      expect(parents).not.toBeNull('No array returned');
      expect(parents.length).toBe(0, 'Found a parent group');
    });
  })

});
