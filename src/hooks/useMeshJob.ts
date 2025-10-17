import { useState, useEffect } from 'react';
import type { JobStatus, StatusResponse, Phase } from '../types/api';
import { config } from '../config';

interface PhaseData {
  phase: Phase;
  label: string;
  description: string;
  timestamp: number;
  queuePosition?: string;
  engineName?: string;
}

interface MeshJobState {
  status: JobStatus | 'IDLE';
  progress: number;
  message?: string;
  currentPhase: Phase;
  phaseHistory: PhaseData[];
  phaseStartTime: number;
  queuePosition?: string;
  engineName?: string;
  asset?: {
    url: string;
    format: string;
    sizeBytes: number;
  } | null;
  error?: string | null;
  isLoading: boolean;
}

// Phase configuration with labels and descriptions from Loading-System.md
const PHASE_CONFIG: Record<Phase, { label: string; description: string; progressThreshold: number }> = {
  uploading: {
    label: 'Uploading',
    description: 'Optimizing and encoding image data for processing',
    progressThreshold: 0,
  },
  queued: {
    label: 'Queued',
    description: 'Awaiting processing slot in generation queue',
    progressThreshold: 0.05,
  },
  preprocessing: {
    label: 'Preprocessing',
    description: 'Normalizing color and lighting data',
    progressThreshold: 0.15,
  },
  depth: {
    label: 'Depth Estimation',
    description: 'Generating surface map from single photo',
    progressThreshold: 0.25,
  },
  reconstruction: {
    label: 'Mesh Reconstruction',
    description: 'Converting depth map into 3D geometry',
    progressThreshold: 0.45,
  },
  texturing: {
    label: 'Texturing',
    description: 'Projecting image colors onto 3D surface',
    progressThreshold: 0.65,
  },
  compiling: {
    label: 'Compiling',
    description: 'Compressing and optimizing mesh for export',
    progressThreshold: 0.85,
  },
  finalizing: {
    label: 'Finalizing',
    description: 'Validating file integrity and upload success',
    progressThreshold: 0.95,
  },
  ready: {
    label: 'Ready',
    description: '3D preview available · tap to view',
    progressThreshold: 1.0,
  },
  error: {
    label: 'Error',
    description: 'An error occurred during processing',
    progressThreshold: 0,
  },
};

// Determine phase from progress based on API data
function determinePhaseFromProgress(progress: number): Phase {
  if (progress >= 0.95) return 'finalizing';
  if (progress >= 0.85) return 'compiling';
  if (progress >= 0.65) return 'texturing';
  if (progress >= 0.45) return 'reconstruction';
  if (progress >= 0.25) return 'depth';
  if (progress >= 0.15) return 'preprocessing';
  if (progress >= 0.05) return 'queued';
  return 'uploading';
}

/**
 * Hook to poll mesh generation job status
 *
 * TWO MODES:
 * 1. REAL API MODE (for new uploads): Uses actual API progress and phases
 * 2. SIMULATED MODE (for cached uploads): Uses config.ts timing for smooth 8-second animation
 *
 * @param taskId - The task ID to poll for status
 * @param isCached - Whether this is a cached upload (uses simulated loading)
 * @param cachedAssetUrl - The cached model URL (if cached)
 */
export function useMeshJob(
  taskId: string | null,
  isCached: boolean = false,
  cachedAssetUrl?: string | null
): MeshJobState {
  const [state, setState] = useState<MeshJobState>({
    status: 'IDLE',
    progress: 0,
    currentPhase: 'uploading',
    phaseHistory: [],
    phaseStartTime: Date.now(),
    queuePosition: undefined,
    engineName: undefined,
    asset: null,
    error: null,
    isLoading: false,
  });

  useEffect(() => {
    if (!taskId) {
      setState({
        status: 'IDLE',
        progress: 0,
        currentPhase: 'uploading',
        phaseHistory: [],
        phaseStartTime: Date.now(),
        queuePosition: undefined,
        engineName: undefined,
        asset: null,
        error: null,
        isLoading: false,
      });
      return;
    }

    const currentTaskId: string = taskId;
    let stopped = false;

    // ========== CACHED MODE: Simulated Loading ==========
    if (isCached && cachedAssetUrl) {
      console.log('⚡ [useMeshJob] CACHED MODE: Using simulated loading');

      const simulatedStartTime = Date.now();

      const progressInterval = setInterval(() => {
        if (stopped) return;

        const elapsed = Date.now() - simulatedStartTime;
        const totalDuration = config.totalLoadingDurationMs;
        const simulatedProgress = Math.min(elapsed / totalDuration, 1);

        // Determine current phase based on elapsed time
        const phaseTimings = config.phaseTimings;
        let currentPhase: Phase = 'uploading';

        if (elapsed >= phaseTimings.finalizing) currentPhase = 'finalizing';
        else if (elapsed >= phaseTimings.compiling) currentPhase = 'compiling';
        else if (elapsed >= phaseTimings.texturing) currentPhase = 'texturing';
        else if (elapsed >= phaseTimings.reconstruction) currentPhase = 'reconstruction';
        else if (elapsed >= phaseTimings.depth) currentPhase = 'depth';
        else if (elapsed >= phaseTimings.preprocessing) currentPhase = 'preprocessing';
        else if (elapsed >= phaseTimings.queued) currentPhase = 'queued';

        setState((prev) => {
          const phaseChanged = currentPhase !== prev.currentPhase;
          let newPhaseHistory = [...prev.phaseHistory];
          let newPhaseStartTime = prev.phaseStartTime;

          if (phaseChanged && prev.currentPhase) {
            const prevConfig = PHASE_CONFIG[prev.currentPhase];
            newPhaseHistory.push({
              phase: prev.currentPhase,
              label: prevConfig.label,
              description: prevConfig.description,
              timestamp: Date.now(),
            });
            newPhaseStartTime = Date.now();
          }

          // If simulation is complete, return final state
          if (simulatedProgress >= 1) {
            clearInterval(progressInterval);
            return {
              status: 'SUCCEEDED',
              progress: 1,
              message: 'Mesh generation complete',
              currentPhase: 'ready',
              phaseHistory: newPhaseHistory,
              phaseStartTime: newPhaseStartTime,
              queuePosition: undefined,
              engineName: undefined,
              asset: {
                url: cachedAssetUrl,
                format: 'glb',
                sizeBytes: 0,
              },
              error: null,
              isLoading: false,
            };
          }

          // Continue simulated progress
          return {
            status: 'RUNNING',
            progress: simulatedProgress,
            message: `Generating mesh... ${Math.round(simulatedProgress * 100)}%`,
            currentPhase,
            phaseHistory: newPhaseHistory,
            phaseStartTime: newPhaseStartTime,
            queuePosition: undefined,
            engineName: undefined,
            asset: null,
            error: null,
            isLoading: false,
          };
        });
      }, 50);

      return () => {
        stopped = true;
        clearInterval(progressInterval);
      };
    }

    // ========== REAL API MODE: Actual Progress ==========
    console.log('📡 [useMeshJob] REAL API MODE: Using actual API progress');

    let pollInterval = config.pollIntervalMs;
    const startTime = Date.now();

    async function poll() {
      if (stopped) return;

      if (!currentTaskId || typeof currentTaskId !== 'string' || currentTaskId.trim() === '') {
        console.error('useMeshJob: Invalid taskId, stopping poll', currentTaskId);
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const apiBaseUrl = config.apiBaseUrl || '';
        const response = await fetch(`${apiBaseUrl}/api/status?id=${encodeURIComponent(currentTaskId)}`);

        if (!response.ok) {
          console.error('Status API error:', response.status);
          setState((prev) => ({ ...prev, isLoading: false }));
          scheduleNextPoll();
          return;
        }

        const data: StatusResponse = await response.json();

        // Determine phase from API data or progress
        const newPhase = data.phase || determinePhaseFromProgress(data.progress);

        setState((prev) => {
          const phaseChanged = newPhase !== prev.currentPhase;
          let newPhaseHistory = [...prev.phaseHistory];
          let newPhaseStartTime = prev.phaseStartTime;

          if (phaseChanged && prev.currentPhase) {
            const prevConfig = PHASE_CONFIG[prev.currentPhase];
            newPhaseHistory.push({
              phase: prev.currentPhase,
              label: prevConfig.label,
              description: prevConfig.description,
              timestamp: Date.now(),
              queuePosition: data.queuePosition,
              engineName: data.engineName,
            });
            newPhaseStartTime = Date.now();
          }

          return {
            status: data.status,
            progress: data.progress,
            message: data.message,
            currentPhase: newPhase,
            phaseHistory: newPhaseHistory,
            phaseStartTime: newPhaseStartTime,
            queuePosition: data.queuePosition,
            engineName: data.engineName,
            asset: data.asset || null,
            error: data.error || null,
            isLoading: false,
          };
        });

        // Stop polling on terminal states
        const terminalStates: JobStatus[] = ['SUCCEEDED', 'FAILED', 'TIMEOUT'];
        if (terminalStates.includes(data.status)) {
          return;
        }

        scheduleNextPoll();
      } catch (error) {
        console.error('Error polling status:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
        scheduleNextPoll();
      }
    }

    function scheduleNextPoll() {
      if (stopped) return;

      const elapsed = Date.now() - startTime;
      if (elapsed > 60000) {
        pollInterval = 8000;
      }

      setTimeout(poll, pollInterval);
    }

    poll();

    return () => {
      stopped = true;
    };
  }, [taskId, isCached, cachedAssetUrl]);

  return state;
}
