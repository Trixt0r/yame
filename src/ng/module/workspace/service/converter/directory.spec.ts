import { DirectoryAsset } from '../../../../../common/asset/directory';
import { AssetService } from '../asset';
import convertDir from './directory';

describe('Workspace directory converter function', () => {

  let assetService = new AssetService();

  it('should resolve a directory asset', done => {
    convertDir({
      name: 'myDir',
      path: '/myDir',
      type: 'directory',
      children: []
    }, assetService)
      .then(asset => expect(asset instanceof DirectoryAsset).toBe(true, 'A directory asset has not been returned'))
      .then(done);
  });

  it('should assign the correct id', done => {
    convertDir({
      name: 'myDir',
      path: '/myDir',
      type: 'directory',
      children: []
    }, assetService)
      .then(asset => expect(asset.id).toEqual('/myDir', '/myDir has not been set as an id'))
      .then(done);
  });

  it('should push children as members', done => {
    convertDir(<any>{
      name: 'myDir',
      path: '/myDir',
      type: 'directory',
      children: [
        {
          name: 'mySubDir',
          path: '/myDir/mySubdir',
          type: 'directory',
          children: [],
        },
        {
          name: 'myFile',
          path: '/myDir/myFile',
          type: 'file'
        },
      ]
    }, assetService)
      .then(asset => expect(asset.members.length).toEqual(2, 'The children have not been added as members'))
      .then(done);
  });

  it('should assign the given directory as the parent of each member', done => {
    convertDir(<any>{
      name: 'myDir',
      path: '/myDir',
      type: 'directory',
      children: [
        {
          name: 'mySubDir',
          path: '/myDir/mySubdir',
          type: 'directory',
          children: [],
        },
        {
          name: 'myFile',
          path: '/myDir/myFile',
          type: 'file'
        },
      ]
    }, assetService)
      .then(asset => asset.members.forEach(member => expect(member.parent).toBe(asset, 'Parent has not been assigned')))
      .then(done);
  });

});
