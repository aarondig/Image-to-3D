export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT';

export interface CreateMeshRequest {
  image: string;
  options?: {
    target_format?: 'glb' | 'obj';
    quality?: 'fast' | 'high';
    subject_type?: 'object' | 'character';
  };
}

export interface CreateMeshResponse {
  taskId: string;
  status: JobStatus;
  etaSeconds?: number;
}

export interface StatusResponse {
  taskId: string;
  status: JobStatus;
  progress: number;
  message?: string;
  asset?: {
    url: string;
    format: string;
    sizeBytes: number;
  };
  error?: string;
}
