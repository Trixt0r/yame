import { ISerializeContext } from 'common/interfaces/serialize-context.interface';
import { IFileState, IFileStateProcessor } from '../editor.state';

export class AddEditorFile {
  static readonly type = '[Editor] Add file';
  constructor(public readonly file?: IFileState, public readonly autoSwitch: boolean = true) { }
}

export class SetEditorFile {
  static readonly type = '[Editor] Set file';
  constructor(public readonly file?: string | IFileState) { }
}

export class RemoveEditorFile {
  static readonly type = '[Editor] Remove file';
  constructor(public readonly file?: string | IFileState) { }
}

export class AddEditorFileProcessor {
  static readonly type = '[Editor] Add file processor';
  constructor(public readonly fileProcessor: IFileStateProcessor) { }
}

export class RemoveEditorFileProcessor {
  static readonly type = '[Editor] Remove file processor';
  constructor(public readonly fileProcessor: string | IFileStateProcessor) { }
}

export class SaveEditorFile {
  static readonly type = '[Editor] Save file';
  constructor(public readonly context: ISerializeContext) { }
}

export class LoadEditorFile {
  static readonly type = '[Editor] Open file';
  constructor(public readonly data: { [key: string]: unknown }, public readonly context: ISerializeContext) { }
}