import { FileAssetPreviewComponent } from './file';
import { ImageAsset } from '../../../../../../../common/asset/image';
import { DirectoryAsset } from '../../../../../../../common/asset/directory';
import { By } from '@angular/platform-browser';
import { MaterialModule } from '../../../../../material';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('FileAssetPreviewComponent', () => {
  let comp: FileAssetPreviewComponent;
  let fixture: ComponentFixture<FileAssetPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [FileAssetPreviewComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FileAssetPreviewComponent);
    comp = fixture.componentInstance;
    comp.asset = new ImageAsset();
    fixture.detectChanges();
  });

  it('should contain an icon', () => {
    let iconDe = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconDe).toBeDefined('No img defined');
    expect(iconDe).not.toBeNull('No img visible');
  });

  it('should display the web_asset icon', () => {
    let iconDe = fixture.debugElement.query(By.css('mat-icon'));
    expect(iconDe.nativeElement.innerHTML).toEqual('web_asset');
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
})
