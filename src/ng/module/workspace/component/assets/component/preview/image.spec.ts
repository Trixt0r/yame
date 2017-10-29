import { ImageAsset } from '../../../../../../../common/asset/image';
import { ImageAssetPreviewComponent } from './image';
import { DirectoryAsset } from '../../../../../../../common/asset/directory';
import { By } from '@angular/platform-browser';
import { MaterialModule } from '../../../../../material';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('ImageAssetPreviewComponent', () => {
  let comp: ImageAssetPreviewComponent;
  let fixture: ComponentFixture<ImageAssetPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
      declarations: [ImageAssetPreviewComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ImageAssetPreviewComponent);
    comp = fixture.componentInstance;
    comp.asset = new ImageAsset();
    comp.asset.content.path = 'test.image.png';
    fixture.detectChanges();
  });

  it('should contain an img', () => {
    let imgDe = fixture.debugElement.query(By.css('img'));
    expect(imgDe).toBeDefined('No img defined');
    expect(imgDe).not.toBeNull('No img visible');
  });

  it('should have the image path as src', () => {
    let imgDe = fixture.debugElement.query(By.css('img'));
    expect((<HTMLImageElement>imgDe.nativeElement).src).toContain('test.image.png');
  });

  afterAll(() => {
    document.body.removeChild(fixture.componentRef.location.nativeElement);
  });
})
