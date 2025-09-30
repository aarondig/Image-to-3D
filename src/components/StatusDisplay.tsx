import { CheckCircle2, XCircle, Loader2, Clock, Download } from 'lucide-react';
import type { JobStatus } from '../types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const getStatusIcon = () => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'FAILED':
      case 'TIMEOUT':
        return <XCircle className="h-12 w-12 text-destructive" />;
      case 'RUNNING':
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
      case 'QUEUED':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      default:
        return <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />;
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

  const getStatusColor = () => {
    switch (status) {
      case 'SUCCEEDED':
        return 'text-green-500';
      case 'FAILED':
      case 'TIMEOUT':
        return 'text-destructive';
      case 'RUNNING':
        return 'text-primary';
      case 'QUEUED':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const isProcessing = status === 'QUEUED' || status === 'RUNNING';
  const hasError = status === 'FAILED' || status === 'TIMEOUT';

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          {/* Status icon */}
          {getStatusIcon()}

          {/* Status text */}
          <div className={cn('text-xl font-semibold', getStatusColor())}>
            {getStatusText()}
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="w-full space-y-2">
              <Progress value={progress * 100} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {Math.round(progress * 100)}%
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <p className="text-sm text-muted-foreground text-center">
              {message}
            </p>
          )}

          {/* Download button */}
          {status === 'SUCCEEDED' && assetUrl && (
            <Button asChild size="lg" className="mt-4">
              <a href={assetUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Download Mesh
              </a>
            </Button>
          )}

          {/* Error message */}
          {hasError && error && (
            <div className="w-full mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
