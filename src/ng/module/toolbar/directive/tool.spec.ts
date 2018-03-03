import { Component, NgModule } from "@angular/core";
import { ToolComponent } from "../component/tool";
import { Tool } from "../tool";
import { DefaultToolComponent } from "../component/default";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToolDirective } from "./tool";
import { MaterialModule } from "../../material";
import { ToolbarService } from "../service";
import { By } from "@angular/platform-browser";

@Component({
  template: `<div [toolHost]="tool"></div>`
})
class TestToolComponent {
  tool: Tool;
}

@NgModule({
  entryComponents: [
    DefaultToolComponent,
  ],
})
class TestModule { }

describe('ToolDirective', () => {

  let comp: TestToolComponent;
  let fixture: ComponentFixture<TestToolComponent>;
  let directive: ToolDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, TestModule],
      declarations: [TestToolComponent, DefaultToolComponent, ToolDirective],
      providers: [ ToolbarService ]
    }).compileComponents();
    fixture = TestBed.createComponent(TestToolComponent);
    comp = fixture.componentInstance;
    let dirEl = fixture.debugElement.query(By.directive(ToolDirective));
    directive = dirEl.injector.get(ToolDirective);
    comp.tool = new Tool('edit', 'edit');
    fixture.detectChanges();
  });

  describe('initial', () => {
    it('should have the same tool as the host component', () => {
      expect(directive.tool).toBe(comp.tool, 'Directive tool is not the same as the component tool');
    });
  });

  describe('ngOnChanges', () => {
    it('shoud not call the render method if no tool changes happened', () => {
      let spy = spyOn(directive, 'render');
      directive.ngOnChanges({});
      expect(spy.calls.any()).toBe(false, 'render() has been called');
    });

    it('should call the render method if the tool changed', () => {
      let spy = spyOn(directive, 'render');
      directive.ngOnChanges({ tool: { } });
      expect(spy.calls.any()).toBe(true, 'render() has not been called');
    });
  });

  describe('render', () => {
    it('shoud not render an unknown tool', () => {
      expect(directive.render()).toBe(null, 'The unknown tool has been rendered');
    });

    it('shoud render a tool component for a known tool', () => {
      let service = TestBed.get(ToolbarService);
      service.register(comp.tool);
      let ref = directive.render();
      expect(ref).not.toBe(null, 'The tool has not been rendered');
      expect(ref.instance instanceof DefaultToolComponent).toBe(true, 'A tool component has not been rendered');
    });
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
});
