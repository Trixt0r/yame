import { DirectoryAsset } from '../../../../../../../common/asset/directory';
import { By } from '@angular/platform-browser';
import { GroupComponent } from './abstract';
import { MaterialModule } from '../../../../../material';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectoryGroupComponent } from './directory';

describe('DirectoryGroupComponent', () => {
  let comp: DirectoryGroupComponent;
  let fixture: ComponentFixture<DirectoryGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [DirectoryGroupComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DirectoryGroupComponent);
    comp = fixture.componentInstance;
    comp.group = new DirectoryAsset();
    comp.group.content.name = 'TestDir';
    fixture.detectChanges();
  });

  it('should be an instance of GroupComponent', () => {
    expect(comp instanceof GroupComponent).toBe(true, 'Is not a GroupComponent');
  });

  it('should contain a mat-list-item', () => {
    let matDe = fixture.debugElement.query(By.css('mat-list-item'));
    expect(matDe).toBeDefined('No mat-list-item defined');
    expect(matDe).not.toBeNull('No mat-list-item visible');
  });

  it('should contain display a folder mat-icon', () => {
    let iconDe = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconDe).toBeDefined('No icon defined');
    expect(iconDe).not.toBeNull('No icon visible');
    expect(iconDe.nativeElement.innerHTML).toEqual('folder', 'No folder icon set');
  });

  it('should display the name as a h4', () => {
    let headerDe = fixture.debugElement.query(By.css('h4'));
    expect(headerDe).toBeDefined('No header defined');
    expect(headerDe).not.toBeNull('No header visible');
    expect(headerDe.nativeElement.innerHTML).toEqual(' TestDir ', 'No name set');
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
})
