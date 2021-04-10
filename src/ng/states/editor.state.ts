import { Injectable } from '@angular/core';
import { Action, NgxsOnInit, Selector, State, StateContext, Store } from '@ngxs/store';
import { AddEditorFile, AddEditorFileProcessor, LoadEditorFile, RemoveEditorFile, RemoveEditorFileProcessor, SaveEditorFile, SetEditorFile } from './actions/editor.action';
import * as uuid from 'uuid';
import { ISerializeContext } from 'common/interfaces/serialize-context.interface';

/**
 * Represents the state of an editor file.
 */
export interface IFileState<T = unknown> {
  /**
   * Internal id of the file state.
   */
  id: string;

  /**
   * URI pointing to the actual file.
   */
  uri?: string;

  /**
   * The name of the file.
   */
  name?: string;

  /**
   * Whether the file is being loaded.
   */
  loading: boolean;

  /**
   * Whether the file is being saved.
   */
  saving: boolean;

  /**
   * Any error occurred while saving or loading.
   */
  error?: Error;

  /**
   * The serialized data the file contains.
   */
  data?: T;
}

/**
 * A file processor is capable of serializing or deserializing editor data to or from files.
 */
export interface IFileStateProcessor {

  /**
   * The key under which the data will be stored or read from.
   */
  key: string;

  /**
   * Serializes data, which will be stored under the `key` of this processor.
   *
   * @param fileState The file state reference.
   * @param context Any serialize context.
   */
  serialize(fileState: IFileState, context: ISerializeContext): Promise<unknown>;

  /**
   * Deserializes the given data, which was read from the `key` this processor defines.
   *
   * @param fileState The file state reference, containing the serialized data.
   * @param context Any deserialize context.
   */
  deserialize(fileState: IFileState, context: ISerializeContext): Promise<unknown>;
}

/**
 * Represents the editor state.
 */
export interface IEditorState {
  /**
   * A list of all available files.
   */
  files: IFileState[];

  /**
   * The current file.
   */
  currentFile: IFileState | null;

  /**
   * A list of file processors.
   */
  fileProcessors: IFileStateProcessor[];
}

@State<IEditorState>({
  name: 'editor',
  defaults: {
    files: [],
    currentFile: null,
    fileProcessors: [],
  },
})
@Injectable()
export class EditorState implements NgxsOnInit {

  // @Selector()

  constructor(protected store: Store) { }

  ngxsOnInit(ctx: StateContext<IEditorState>) {
    ctx.dispatch(new AddEditorFile());
  }

  /**
   * Searches for a file state whose id matches the provided one.
   *
   * @param idOrFileState The id or file state to search for.
   */
  findById(idOrFileState: string | IFileState): IFileState | void {
    const id = typeof idOrFileState === 'string' ? idOrFileState : (idOrFileState as IFileState).id;
    if (!id) return;
    const state = this.store.snapshot().editor as IEditorState;
    return state.files.find((it) => it.id === id);
  }

  @Action(AddEditorFile)
  addFile(ctx: StateContext<IEditorState>, action: AddEditorFile) {
    const file = Object.assign({ id: uuid.v4(), loading: false, saving: false }, action.file) as IFileState;
    const found = this.findById(file.id);
    if (found) return console.error(`[EditorState] File with id "${found.id}" already exists.`);

    const state = ctx.getState();
    const files = state.files.slice();
    files.push(file);
    const current = state.currentFile;
    if (!current || action.autoSwitch) ctx.patchState({ currentFile: file, files });
    else ctx.patchState({ files });
  }

  @Action(SetEditorFile)
  setFile(ctx: StateContext<IEditorState>, action: SetEditorFile) {
    const id = typeof action.file === 'string' ? action.file : (action.file as IFileState).id;
    const found = this.findById(id);
    if (!found) return console.error(`[EditorState] File with id "${id}" not found.`);
    ctx.patchState({ currentFile: found });
  }

  @Action(RemoveEditorFile)
  removeFile(ctx: StateContext<IEditorState>, action: RemoveEditorFile) {
    const id = typeof action.file === 'string' ? action.file : (action.file as IFileState).id;
    const found = this.findById(id);
    if (!found) return console.error(`[EditorState] File with id "${id}" not found.`);
    const state = ctx.getState();
    const files = state.files.slice();
    const idx = files.indexOf(found);
    if (idx >= 0) {
      files.splice(idx, 1);
      if (state.currentFile && state.currentFile.id === id) ctx.patchState({ files, currentFile: null });
      else ctx.patchState({ files });
    }
  }

  @Action(AddEditorFileProcessor)
  addProcessor(ctx: StateContext<IEditorState>, action: AddEditorFileProcessor) {
    const state = ctx.getState();
    const key = action.fileProcessor.key;
    const found = state.fileProcessors.find(it => it.key === key);
    if (found) return console.error(`[EditorState] File processor with key "${key}" already exists.`);
    const fileProcessors = state.fileProcessors.slice();
    fileProcessors.push(action.fileProcessor);
    ctx.patchState({ fileProcessors });
  }

  @Action(RemoveEditorFileProcessor)
  removeProcessor(ctx: StateContext<IEditorState>, action: RemoveEditorFileProcessor) {
    const state = ctx.getState();
    const key = typeof action.fileProcessor === 'string' ? action.fileProcessor : action.fileProcessor.key;
    const idx = state.fileProcessors.findIndex(it => it.key === key);
    if (idx < 0) return console.error(`[EditorState] File processor with key "${key}" not found.`);
    const fileProcessors = state.fileProcessors.slice();
    fileProcessors.splice(idx, 1);
    ctx.patchState({ fileProcessors });
  }

  @Action(SaveEditorFile)
  saveFile(ctx: StateContext<IEditorState>, action: SaveEditorFile) {
    const state = ctx.getState();
    const processors = state.fileProcessors;
    const currentFile = state.currentFile;
    if (!currentFile) throw new Error(`[Editor] No current file present.`);
    if (currentFile.uri || action.context.as) currentFile.uri = action.context.uri!;

    currentFile.saving = true;

    ctx.patchState({ currentFile });
    const data: { [key: string]: unknown } = { };
    // Note, that async/await is not used since it causes race condition issues with store.dispatch
    return Promise.all(processors.map(async processor => {
      return data[processor.key] = await processor.serialize(currentFile, action.context);
    })).finally(() => {
      currentFile.data = data;
      currentFile.saving = false;
      ctx.patchState({ currentFile });
    });
  }

  @Action(LoadEditorFile)
  loadFile(ctx: StateContext<IEditorState>, action: LoadEditorFile) {
    const state = ctx.getState();
    const currentFile = state.currentFile;
    if (!currentFile) throw new Error(`[Editor] No current file present.`);
    return ctx.dispatch(new RemoveEditorFile(currentFile.id)).toPromise()
            .then(() => ctx.dispatch(new AddEditorFile()).toPromise())
            .then(async () => {
              const state = ctx.getState();
              const processors = state.fileProcessors;
              const currentFile = state.currentFile;
              currentFile!.data = action.data;
              currentFile!.uri = action.context.uri;
              currentFile!.loading = true;

              await Promise.all(processors.map(async processor => {
                return await processor.deserialize(currentFile!, action.context);
              }));
            });
    // if (currentFile.uri || action.context.saveAs) currentFile.uri = action.context.uri!;
  }
}
