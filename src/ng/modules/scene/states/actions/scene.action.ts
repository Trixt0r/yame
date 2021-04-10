export class LoadScene {
  static readonly type = '[Scene] Load';
  constructor(public ctx = { }) {}
}

export class SaveScene {
  static readonly type = '[Scene] Save';
  constructor(public ctx = { }) {}
}

export class ResetScene {
  static readonly type = '[Scene] Reset';
  constructor() {}
}

export type SceneAction = LoadScene | ResetScene;