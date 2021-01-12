import { Tool } from "./tool";

describe('Tool', () => {

  let tool: Tool;

  beforeEach(() => {
    tool = new Tool('myTool', 'myIcon');
  });

  it('should have the assigned id and not be active', () => {
    expect(tool.isActive).toBe(false, 'Tool should not be active');
    expect(tool.id).toEqual('myTool', 'Wrong id applied to the tool');
  });

  describe('activate', () => {
    it('should activate the tool and emit the `activated` event if not active yet', done => {
      let handler = { fn: function() { } };
      spyOn(handler, 'fn');
      tool.on('activated', handler.fn);
      tool.activate()
        .then(re => {
          expect(re).toBe(true);
          expect(handler.fn).toHaveBeenCalledTimes(1);
          expect(tool.isActive).toBe(true);
          done();
        })
        .catch(() => {
          fail('Should not reject');
          done();
        });
    });

    it('should resolve false if already activated', done => {
      let handler = { fn: function() { } };
      spyOn(handler, 'fn');
      tool.activate()
        .then(() => tool.on('activated', handler.fn))
        .then(() => tool.activate())
        .then(re => {
          expect(re).toBe(false);
          expect(handler.fn).not.toHaveBeenCalled();
          expect(tool.isActive).toBe(true);
          done();
        })
        .catch(() => {
          fail('Should not reject');
          done();
        });
    });
  });

  describe('deactivate', () => {
    it('should deactivate the tool and emit the `deactivated` event if active', done => {
      let handler = { fn: function() { } };
      spyOn(handler, 'fn');
      tool.on('deactivated', handler.fn);
      tool.activate()
        .then(() => tool.deactivate())
        .then(re => {
          expect(re).toBe(true);
          expect(handler.fn).toHaveBeenCalledTimes(1);
          expect(tool.isActive).toBe(false);
          done();
        })
        .catch(() => {
          fail('Should not reject');
          done();
        });
    });

    it('should resolve false if already deactivated', done => {
      let handler = { fn: function() { } };
      spyOn(handler, 'fn');
      tool.on('deactivated', handler.fn);
      tool.deactivate()
        .then(re => {
          expect(re).toBe(false);
          expect(handler.fn).not.toHaveBeenCalled();
          expect(tool.isActive).toBe(false);
          done();
        })
        .catch(() => {
          fail('Should not reject');
          done();
        });
    });
  });

});
