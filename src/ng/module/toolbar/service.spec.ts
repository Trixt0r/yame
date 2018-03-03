import { ToolbarService } from "./service";
import { Tool } from "./tool";
import { DefaultToolComponent } from "./component/default";
import { ToolbarServiceException } from "./exception/service";
import { ToolComponent } from "./component/tool";

class MyToolComponent extends ToolComponent { }

describe('ToolbarService', () => {

  let service: ToolbarService;

  beforeEach(() => {
    service = new ToolbarService();
  });

  describe('initial', () => {
    it('should have no registered tools', () => {
      expect(service.tools.length).toBe(0, 'The service should not have any tools');
    });
  });

  describe('register', () => {
    it('should add the given tool to the tools list with the default tool component', () => {
      let myTool = new Tool('edit', 'edit');
      service.register(myTool);
      expect(service.tools.length).toBe(1, 'Tool has not been added');
      expect(service.tools[0]).toBe(myTool, 'Wrong tool instance registered');
      expect(service.getComponent(myTool)).toBe(DefaultToolComponent, 'Wrong tool component registered');
      expect(service.getTool('edit')).toBe(myTool, 'Wrong tool instance mapped');
    });

    it('should add the given tool to the tools list with the a custom tool component', () => {
      let myTool = new Tool('edit', 'edit');
      service.register(myTool, MyToolComponent);
      expect(service.getComponent(myTool)).toBe(MyToolComponent, 'Wrong tool component registered');
    });

    it('should not allow two tools with the same id', () => {
      service.register(new Tool('edit', 'edit'));
      try {
        service.register(new Tool('edit', 'edit'));
        fail('Should fail');
      } catch (e) {
        expect(e instanceof ToolbarServiceException).toBe(true, 'Wrong exception type');
        expect(e.message).toEqual(`Tool 'edit' is already registered`, 'Wrong message thrown');
      }
    });

    it('should emit the registered event', () => {
      let handler = { fn: function() { } };
      spyOn(handler, 'fn');
      service.registered$.subscribe(handler.fn);
      service.register(new Tool('edit', 'edit'));
      expect(handler.fn).toHaveBeenCalledTimes(1);
    });

    it('should activate the tool if no tools were available', done => {
      let myTool = new Tool('edit', 'edit');
      service.register(myTool)
        .then(() => {
          expect(service.activeTool).toBe(myTool, 'Wrong tool is active');
          done();
        })
        .catch(() => {
          fail('Should not fail');
          done();
        });
    });
  });

  describe('activate', () => {
    it('should throw an exception if the tool is not registered', () => {
      try {
        service.activate(new Tool('edit', 'edit'));
        fail('Should fail');
      } catch (e) {
        expect(e instanceof ToolbarServiceException).toBe(true, 'Wrong exception type');
        expect(e.message).toEqual('Tool to activate not found', 'Wrong message thrown');
      }
    });

    it('should not activate the tool if already registered', done => {
      service.register(new Tool('edit', 'edit'))
        .then(() => {
          return service.activate('edit')
            .then(re => {
              expect(re).toBe(false, 'Tool has been activated');
              expect(service.activeTool.id).toBe('edit');
              done();
            });
        })
        .catch(() => {
          fail('Should not fail');
          done();
        });
    });

    it('should activate the registered tool', done => {
      let toActivate = new Tool('settings', 'settings');
      service.register(new Tool('edit', 'edit'));
      service.register(toActivate);
      service.activate('settings')
        .then(re => {
          expect(re).toBe(true, 'Tool has not been activated');
          expect(toActivate.isActive).toBe(true);
          expect(service.activeTool.id).toBe('settings');
          done();
        })
        .catch(() => {
          fail('Should not fail');
          done();
        });
    });

    it('should deactivate the previous active tool ', done => {
      service.register(new Tool('edit', 'edit'))
        .then(() => service.register(new Tool('settings', 'settings')))
        .then(() => {
          return service.activate('settings')
            .then(re => {
              expect(service.activeTool.id).toBe('settings');
              expect(service.getTool('edit').isActive).toBe(false, 'Previous active tool is still active');
              done();
            });
        })
        .catch(() => {
          fail('Should not fail');
          done();
        });
    });

    it('should emit the activated event', done => {
      let handler = { fn: function(tool) { expect(tool.id).toEqual('settings', 'Wrong tool activated') } };
      spyOn(handler, 'fn');
      service.register(new Tool('edit', 'edit'))
        .then(() => service.register(new Tool('settings', 'settings')))
        .then(() => service.activated$.subscribe(handler.fn))
        .then(() => service.activate('settings'))
        .then(re => {
          expect(handler.fn).toHaveBeenCalledTimes(1);
          done();
        })
        .catch(() => {
          fail('Should not fail');
          done();
        });
    });

    it('should emit the deactivated event', done => {
      let handler = { fn: function(tool) { expect(tool.id).toEqual('edit', 'Wrong tool deactivated') } };
      spyOn(handler, 'fn');
      service.register(new Tool('edit', 'edit'))
        .then(() => service.register(new Tool('settings', 'settings')))
        .then(() => service.deactivated$.subscribe(handler.fn))
        .then(() => service.activate('settings'))
        .then(re => {
          expect(handler.fn).toHaveBeenCalledTimes(1);
          done();
        })
        .catch(() => {
          fail('Should not fail');
          done();
        });
    });

  });

});
