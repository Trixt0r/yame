import { GroupComponent } from '../component/group/abstract';
import { MaterialModule } from '../../../../material';
import { DirectoryGroupComponent } from '../component/group/directory';
import { GroupComponentService } from '../../../service/group-component';
import { By } from '@angular/platform-browser';
import { DirectoryAsset } from '../../../../../../common/asset/directory';
import { GroupDirective } from './group';
import { Asset } from '../../../../../../common/asset';
import { AssetGroup } from '../../../../../../common/asset/group';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, NgModule } from '@angular/core';

@Component({
  template: `<div [groupHost]="group"></div>`
})
class TestGroupHostComponent {
  group: AssetGroup<Asset>;
}

@NgModule({
  entryComponents: [
    DirectoryGroupComponent,
  ],
})
class TestModule { }

describe('GroupDirective', () => {

    let comp: TestGroupHostComponent;
    let fixture: ComponentFixture<TestGroupHostComponent>;
    let directive: GroupDirective;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [MaterialModule, TestModule],
        declarations: [TestGroupHostComponent, GroupDirective, DirectoryGroupComponent],
        providers: [ GroupComponentService ]
      }).compileComponents();
      fixture = TestBed.createComponent(TestGroupHostComponent);
      comp = fixture.componentInstance;
      let dirEl = fixture.debugElement.query(By.directive(GroupDirective));
      directive = dirEl.injector.get(GroupDirective);
      comp.group = new DirectoryAsset();
      fixture.detectChanges();
    });

    describe('initial', () => {
      it('should have the same group as the host component', () => {
        expect(directive.group).toBe(comp.group, 'Directive group is not the same as the component group');
      });
    });

    describe('ngOnChanges', () => {
      it('shoud not call the render method if no group changes happened', () => {
        let spy = spyOn(directive, 'render');
        directive.ngOnChanges({});
        expect(spy.calls.any()).toBe(false, 'render() has been called');
      });

      it('should call the render method if the group changed', () => {
        let spy = spyOn(directive, 'render');
        directive.ngOnChanges({ group: { } });
        expect(spy.calls.any()).toBe(true, 'render() has not been called');
      });
    });

    describe('render', () => {
      it('shoud not render an unknown asset group', () => {
        expect(directive.render()).toBe(null, 'The unknown group has been rendered');
      });

      it('shoud render a group component for a known asset group', () => {
        let service = fixture.debugElement.injector.get(GroupComponentService);
        service.register('directory', DirectoryGroupComponent);
        let ref = directive.render();
        expect(ref).not.toBe(null, 'The group has not been rendered');
        expect(ref.instance instanceof GroupComponent).toBe(true, 'A component group has not been rendered');
      });

      it('shoud register a click event handler on the created componentn', () => {
        let service = fixture.debugElement.injector.get(GroupComponentService);
        service.register('directory', DirectoryGroupComponent);
        let dirEl = fixture.debugElement.query(By.directive(GroupDirective));
        let ref = directive.render();
        expect(ref.instance.clickEvent.observers.length).toBe(1, 'Click handler has not been registered');
      });
    });

    afterAll(() => {
      document.body.removeChild(fixture.componentRef.location.nativeElement);
    });
  });
