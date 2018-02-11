import { ImageAsset } from '../../../../../common/asset/image';
import convertImg from './image';

describe('Workspace image converter function', () => {

  const fileContent = {
    path: '/myImg.png',
    name: 'myImg.png',
    simpleName: 'myImg',
    type: 'png'
  };

  it('should resolve an image asset', done => {
    convertImg(fileContent)
      .then(img => expect(img instanceof ImageAsset).toBe(true, 'The result is not an image asset'))
      .then(done);
  });

  it('should assign the path as the id', done => {
    convertImg(fileContent)
      .then(img => expect(img.id).toBe('/myImg.png', 'The path has not been assigned as the id'))
      .then(done);
  });

  it('should copy the file content', done => {
    convertImg(fileContent)
      .then(img => {
        expect(img.content).toBeDefined('No file content defined');
        expect(img.content).not.toBe(fileContent, 'The file content has not been cloned');
      })
      .then(done);
  });

});
