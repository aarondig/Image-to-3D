import { useState, useEffect } from 'react';
import type { JobStatus, StatusResponse } from '../types/api';
import { config } from '../config';

interface MeshJobState {
  status: JobStatus | 'IDLE';
  progress: number;
  message?: string;
  asset?: {
    url: string;
    format: string;
    sizeBytes: number;
    usdzUrl?: string;
  } | null;
  error?: string | null;
  isLoading: boolean;
}

/**
 * Hook to poll mesh generation job status
 * Automatically stops polling on terminal states (SUCCEEDED, FAILED, TIMEOUT)
 * Implements exponential backoff after 60 seconds
 */
export function useMeshJob(taskId: string | null): MeshJobState {
  const [state, setState] = useState<MeshJobState>({
    status: 'IDLE',
    progress: 0,
    asset: null,
    error: null,
    isLoading: false,
  });

  useEffect(() => {
    if (!taskId) {
      setState({
        status: 'IDLE',
        progress: 0,
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

    async function poll() {
      if (stopped) return;

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

        setState({
          status: data.status,
          progress: data.progress,
          message: data.message,
          asset: data.asset || null,
          error: data.error || null,
          isLoading: false,
        });

        // Stop polling on terminal states
        const terminalStates: JobStatus[] = ['SUCCEEDED', 'FAILED', 'TIMEOUT'];
        if (terminalStates.includes(data.status)) {
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
    };
  }, [taskId]);

  return state;
}
