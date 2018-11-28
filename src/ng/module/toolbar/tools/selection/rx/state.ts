interface IPoint {
  x: number;
  y: number;
}

export interface ISelectionState {
  entities: string[];
  position: IPoint;
  size: IPoint;
  rotation: number;
};
