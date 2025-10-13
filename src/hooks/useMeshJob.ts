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
  loadingStartTime: number; // Overall loading start time for the 8-second animation
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

// Determine phase from progress if not provided by API
// Currently unused - phase is determined by simulation timing
// function determinePhaseFromProgress(progress: number): Phase {
//   if (progress >= 0.95) return 'finalizing';
//   if (progress >= 0.85) return 'compiling';
//   if (progress >= 0.65) return 'texturing';
//   if (progress >= 0.45) return 'reconstruction';
//   if (progress >= 0.25) return 'depth';
//   if (progress >= 0.15) return 'preprocessing';
//   if (progress >= 0.05) return 'queued';
//   return 'uploading';
// }

/**
 * Hook to poll mesh generation job status
 * Automatically stops polling on terminal states (SUCCEEDED, FAILED, TIMEOUT)
 * Implements exponential backoff after 60 seconds
 * Tracks phase progression and history for progressive UI
 *
 * SIMULATED LOADING: Always shows 8-second loading animation regardless of cache/API speed
 * @param taskId - The task ID to poll for status
 * @param preloadedAssetUrl - Optional cached model URL to use instead of polling API
 */
export function useMeshJob(taskId: string | null, preloadedAssetUrl?: string | null): MeshJobState {
  const [state, setState] = useState<MeshJobState>({
    status: 'IDLE',
    progress: 0,
    currentPhase: 'uploading',
    phaseHistory: [],
    phaseStartTime: Date.now(),
    loadingStartTime: Date.now(),
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
        loadingStartTime: Date.now(),
        queuePosition: undefined,
        engineName: undefined,
        asset: null,
        error: null,
        isLoading: false,
      });
      return;
    }

    // Store taskId in a constant to narrow the type
    const currentTaskId: string = taskId;

    let stopped = false;
    let pollInterval = config.pollIntervalMs; // Start at 5 seconds
    const startTime = Date.now();
    const simulatedStartTime = Date.now();

    // Store the actual API result when received
    let actualResult: StatusResponse | null = null;
    let hasReceivedResult = false;

    // Simulated progress updater (runs every 50ms for smooth animation)
    const progressInterval = setInterval(() => {
      if (stopped) return;

      const elapsed = Date.now() - simulatedStartTime;
      const totalDuration = config.totalLoadingDurationMs;

      // Calculate progress (0 to 1) based on elapsed time
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
        // Check if phase has changed
        const phaseChanged = currentPhase !== prev.currentPhase;

        // Build new phase history
        let newPhaseHistory = [...prev.phaseHistory];
        let newPhaseStartTime = prev.phaseStartTime;

        if (phaseChanged) {
          // Add previous phase to history
          if (prev.currentPhase) {
            const prevConfig = PHASE_CONFIG[prev.currentPhase];
            newPhaseHistory.push({
              phase: prev.currentPhase,
              label: prevConfig.label,
              description: prevConfig.description,
              timestamp: Date.now(),
              queuePosition: prev.queuePosition,
              engineName: prev.engineName,
            });
          }
          // Reset phase start time for new phase
          newPhaseStartTime = Date.now();
        }

        // If we've received the actual result and simulation is complete
        if (hasReceivedResult && simulatedProgress >= 1 && actualResult) {
          return {
            status: actualResult.status,
            progress: 1,
            message: actualResult.message,
            currentPhase: 'ready',
            phaseHistory: newPhaseHistory,
            phaseStartTime: newPhaseStartTime,
            loadingStartTime: prev.loadingStartTime,
            queuePosition: actualResult.queuePosition,
            engineName: actualResult.engineName,
            asset: actualResult.asset || null,
            error: actualResult.error || null,
            isLoading: false,
          };
        }

        // If we have a preloaded asset (cached result) and simulation is complete
        if (preloadedAssetUrl && simulatedProgress >= 1) {
          return {
            status: 'SUCCEEDED',
            progress: 1,
            message: 'Mesh generation complete',
            currentPhase: 'ready',
            phaseHistory: newPhaseHistory,
            phaseStartTime: newPhaseStartTime,
            loadingStartTime: prev.loadingStartTime,
            queuePosition: prev.queuePosition,
            engineName: prev.engineName,
            asset: {
              url: preloadedAssetUrl,
              format: 'glb',
              sizeBytes: 0,
            },
            error: null,
            isLoading: false,
          };
        }

        // Continue showing simulated progress
        return {
          status: prev.status === 'IDLE' ? 'RUNNING' : prev.status,
          progress: simulatedProgress,
          message: prev.message,
          currentPhase,
          phaseHistory: newPhaseHistory,
          phaseStartTime: newPhaseStartTime,
          loadingStartTime: prev.loadingStartTime,
          queuePosition: prev.queuePosition,
          engineName: prev.engineName,
          asset: prev.asset,
          error: prev.error,
          isLoading: prev.isLoading,
        };
      });

      // Stop progress simulation when complete
      if (simulatedProgress >= 1) {
        clearInterval(progressInterval);
      }
    }, 50); // Update every 50ms for smooth animation

    async function poll() {
      if (stopped) return;

      // Skip API polling if we have a preloaded asset (cached result)
      if (preloadedAssetUrl) {
        console.log('⚡ [useMeshJob] Using cached model, skipping API poll');
        return;
      }

      // Guard: Don't fetch if taskId is invalid
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
          // Continue polling on errors (transient network issues)
          setState((prev) => ({ ...prev, isLoading: false }));
          scheduleNextPoll();
          return;
        }

        const data: StatusResponse = await response.json();

        // Store the actual result but don't immediately update the UI
        actualResult = data;
        hasReceivedResult = true;

        setState((prev) => ({
          ...prev,
          queuePosition: data.queuePosition,
          engineName: data.engineName,
          message: data.message,
          isLoading: false,
        }));

        // Stop polling on terminal states
        const terminalStates: JobStatus[] = ['SUCCEEDED', 'FAILED', 'TIMEOUT'];
        if (terminalStates.includes(data.status)) {
          // If it's an error state, show immediately
          if (data.status === 'FAILED' || data.status === 'TIMEOUT') {
            clearInterval(progressInterval);
            setState({
              status: data.status,
              progress: 0,
              message: data.message,
              currentPhase: 'error',
              phaseHistory: [],
              phaseStartTime: Date.now(),
              loadingStartTime: simulatedStartTime,
              queuePosition: data.queuePosition,
              engineName: data.engineName,
              asset: null,
              error: data.error || 'An error occurred',
              isLoading: false,
            });
          }
          return; // Stop polling
        }

        // Continue polling
        scheduleNextPoll();
      } catch (error) {
        console.error('Error polling status:', error);
        // Continue polling on fetch errors
        setState((prev) => ({ ...prev, isLoading: false }));
        scheduleNextPoll();
      }
    }

    function scheduleNextPoll() {
      if (stopped) return;

      // Implement exponential backoff after 60 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed > 60000) {
        pollInterval = 8000; // Increase to 8 seconds after 1 minute
      }

      setTimeout(poll, pollInterval);
    }

    // Start polling immediately
    poll();

    // Cleanup function
    return () => {
      stopped = true;
      clearInterval(progressInterval);
    };
  }, [taskId, preloadedAssetUrl]);

  return state;
}
