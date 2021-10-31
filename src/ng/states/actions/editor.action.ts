import { ISerializeContext } from 'common/interfaces/serialize-context.interface';
import { IFileState, IFileSerializer } from '../editor.state';

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

export class AddEditorFileSerializer {
  static readonly type = '[Editor] Add file processor';
  constructor(public readonly fileProcessor: IFileSerializer) { }
}

export class RemoveEditorFileProcessor {
  static readonly type = '[Editor] Remove file processor';
  constructor(public readonly fileProcessor: string | IFileSerializer) { }
}

export class SaveEditorFile<T = unknown> {
  static readonly type = '[Editor] Save file';
  constructor(public readonly context: ISerializeContext<T>) { }
}
export class LoadEditorFile<T = unknown> {
  static readonly type = '[Editor] Load file';
  constructor(public readonly context: ISerializeContext<T>) { }
}

export class OpenEditorFile {
  static readonly type = '[Editor] Open file';
  constructor(public uri: string, public protocol: string, public source: string) { }
}