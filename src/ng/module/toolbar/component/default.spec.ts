import { DefaultToolComponent } from "./default";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MaterialModule } from "../../material.module";
import { Tool } from "../tool";
import { ToolComponent } from "./tool";
import { By } from "@angular/platform-browser";


describe('DefaultToolComponent', () => {
  let comp: DefaultToolComponent;
  let fixture: ComponentFixture<DefaultToolComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DefaultToolComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DefaultToolComponent);
    comp = fixture.componentInstance;
    comp.tool = new Tool('edit', 'edit');
    fixture.detectChanges();
  });

  it('should be an instance of ToolComponent', () => {
    expect(comp instanceof ToolComponent).toBe(true, 'Is not a ToolComponent');
  });

  it('should show the icon of the tool in a mat-icon', () => {
    let iconDe = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconDe).toBeDefined('No icon defined');
    expect(iconDe).not.toBeNull('No icon visible');
    expect(iconDe.nativeElement.innerHTML).toEqual(comp.tool.icon, 'Wrong icon set');
  });

  it('should display the build mat-icon by default, if the tool has no icon', () => {
    comp.tool.icon = '';
    fixture.detectChanges();
    let iconDe = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconDe).toBeDefined('No icon defined');
    expect(iconDe).not.toBeNull('No icon visible');
    expect(iconDe.nativeElement.innerHTML).toEqual(`build`, 'Wrong icon set');
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
});
