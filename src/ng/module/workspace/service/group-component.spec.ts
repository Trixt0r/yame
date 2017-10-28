import { InvalidGroupComponentException } from '../exception/service/invalid-group-component';
import { GroupComponent } from '../component/groups/component/group/abstract';
import { GroupComponentService } from './group-component';

class MyGroupComponent extends GroupComponent {
}
class MyGroupComponent2 extends GroupComponent {
}

describe('GroupComponentService', () => {

  let service: GroupComponentService;

  beforeEach(() => {
    service = new GroupComponentService();
  });

  describe('register and get', () => {
    it ('should register a group component for the type "myType"', () => {
      service.register('myType', MyGroupComponent);
      expect(service.get('myType')).toBeDefined('No group defined for type "myType"');
      expect(service.get('myType')).not.toBeNull('Group for type "myType" is null');
      expect(service.get('myType')).toBe(MyGroupComponent, 'The incorrect group component is defined');
    });

    it ('should throw an InvalidGroupComponentException if the registered component class is not a sub class of GroupComponent', () => {
      try {
        service.register('myType', <any>{})
      } catch (e) {
        expect(e instanceof InvalidGroupComponentException).toBe(true, 'No instance of InvalidGroupComponentException has been thrown')
      }
      expect(() => service.register('myType', <any>{})).toThrowError('The group component class has to extend GroupComponent') ;
    });

    it ('should have no registered group component for an unknown asset type', () => {
      expect(service.get('unknownType')).toBeUndefined('Group defined for type "unknownType"');
    });

    it ('should allow to override a group component for an asset type', () => {
      service.register('myType', MyGroupComponent);
      expect(service.get('myType')).toBe(MyGroupComponent, 'The incorrect group component is defined');
      service.register('myType', MyGroupComponent2);
      expect(service.get('myType')).toBe(MyGroupComponent2, 'The group component has not been overriden');
    });
  });

});
