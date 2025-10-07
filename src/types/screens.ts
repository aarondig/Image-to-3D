export type Screen =
  | 'HOME'
  | 'UPLOAD'
  | 'PROCESSING'
  | 'POINT_CLOUD'
  | 'MESH_READY'
  | 'MESH_VIEWER'
  | 'ERROR';

export interface AppState {
  screen: Screen;
  image: string | null;
  taskId: string | null;
  meshUrl: string | null;
  error: string | null;
  progress: number;
}
