import { Component, Inject, Input, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SceneComponentsService } from 'ng/modules/sidebar/services/scene-components.service';
import { SceneComponent, SceneEntity } from 'common/scene';
import { FormControl, Validators } from '@angular/forms';
import { SceneComponentService, componentIdValidator } from 'ng/modules/scene';
import { Subscription } from 'rxjs';
import { DefaultErrorStateMatcher } from 'ng/modules/utils/matchers/default-error-state.matcher';
import { cloneDeep } from 'lodash';

/**
 * Interface for the dialog exchange data.
 */
interface DialogData {
  /**
   * The component id.
   */
  id: string;

  /**
   * The scene entities.
   */
  entities: SceneEntity[];
}

/**
 * A component for editing the id of a scene component.
 */
@Component({
  selector: 'yame-edit-component',
  templateUrl: 'edit.component.html',
  styleUrls: ['edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponentComponent {
  /**
   * The scene entity reference.
   */
  @Input() entities: SceneEntity[] = [];

  /**
   * The scene component reference.
   */
  @Input() component?: SceneComponent;

  /**
   * Creates an instance of an edit component.
   *
   * @param dialog The mat dialog provider for creation the actual dialog.
   * @param components The component service
   */
  constructor(public dialog: MatDialog, protected components: SceneComponentsService) {}

  /**
   * Opens an edit component dialog.
   *
   * @param event The mouse event.
   */
  openDialog(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const dialogRef = this.dialog.open(EditComponentDialogComponent, {
      autoFocus: true,
      data: {
        id: this.component?.id,
        entities: this.entities,
      },
      restoreFocus: false,
      width: '250px',
    });

    const sub = dialogRef.afterClosed().subscribe(id => {
      sub.unsubscribe();
      if (!id || !this.component) return;
      const old = cloneDeep(this.component);
      this.component.id = id;
      this.components.updateSceneComponent(this.entities, this.component, old);
    });
  }
}

/**
 * A component for editing the id of a scene component.
 */
@Component({
  selector: 'yame-edit-dialog-component',
  templateUrl: 'dialog.component.html',
})
export class EditComponentDialogComponent implements OnDestroy {
  /**
   * The form control for validating the id input.
   */
  formControl: FormControl;

  /**
   * Matcher for matching input error state.
   */
  matcher = new DefaultErrorStateMatcher();

  /**
   * Indicates whether the "save" button is disabled or not.
   */
  disabled: boolean = false;

  /**
   * The internal value change subscription.
   */
  protected sub: Subscription;

  /**
   * Creates a new dialog component for editing the id of a scene component.
   *
   * @param components The components service.
   * @param dialogRef The dialog reference.
   * @param data The dialog data.
   * @param cdr The change detection reference.
   */
  constructor(
    public components: SceneComponentService,
    public dialogRef: MatDialogRef<EditComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    cdr: ChangeDetectorRef
  ) {
    this.formControl = new FormControl(data.id, [
      Validators.required,
      componentIdValidator(data.id, data.entities, components),
    ]);

    this.sub = this.formControl.valueChanges.subscribe(() => {
      this.disabled = this.formControl.invalid;
      cdr.markForCheck();
    });
  }

  /**
   * Handles the cancel click.
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Handles the id save.
   */
  onSave(): void {
    const valid = this.formControl.valid;
    if (!valid) return;
    this.dialogRef.close(this.formControl.value);
  }

  /**
   * Unsubscribes the previously created subscriptions.
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
