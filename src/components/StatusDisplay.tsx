import type { JobStatus } from '../types/api';

interface StatusDisplayProps {
  status: JobStatus;
  progress: number;
  message?: string;
  assetUrl?: string;
  error?: string;
}

export function StatusDisplay({
  status,
  progress,
  message,
  assetUrl,
  error,
}: StatusDisplayProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'SUCCEEDED':
        return '#4ade80';
      case 'FAILED':
      case 'TIMEOUT':
        return '#ff4a4a';
      case 'RUNNING':
        return '#4a9eff';
      case 'QUEUED':
        return '#fbbf24';
      default:
        return '#666';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'QUEUED':
        return 'Queued...';
      case 'RUNNING':
        return 'Generating mesh...';
      case 'SUCCEEDED':
        return 'Complete!';
      case 'FAILED':
        return 'Failed';
      case 'TIMEOUT':
        return 'Timeout';
      default:
        return 'Processing...';
    }
  };

  const isProcessing = status === 'QUEUED' || status === 'RUNNING';
  const hasError = status === 'FAILED' || status === 'TIMEOUT';

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          padding: '24px',
          background: '#0f0f0f',
          borderRadius: '8px',
          border: '1px solid #333',
        }}
      >
        {/* Status text */}
        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: getStatusColor(),
            marginBottom: '16px',
          }}
        >
          {getStatusText()}
        </div>

        {/* Spinner for processing */}
        {isProcessing && (
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #333',
              borderTop: `4px solid ${getStatusColor()}`,
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}

        {/* Progress bar */}
        {isProcessing && (
          <div
            style={{
              width: '100%',
              height: '8px',
              background: '#222',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: getStatusColor(),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}

        {/* Progress percentage */}
        {isProcessing && (
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
            {Math.round(progress * 100)}%
          </p>
        )}

        {/* Message */}
        {message && (
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
            {message}
          </p>
        )}

        {/* Download link */}
        {status === 'SUCCEEDED' && assetUrl && (
          <div style={{ marginTop: '16px' }}>
            <a
              href={assetUrl}
              download
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#4ade80',
                color: '#000',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#22c55e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4ade80';
              }}
            >
              Download Mesh
            </a>
          </div>
        )}

        {/* Error message */}
        {hasError && error && (
          <p
            style={{
              color: '#ff4a4a',
              fontSize: '14px',
              marginTop: '16px',
              padding: '12px',
              background: '#1a0a0a',
              borderRadius: '4px',
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
