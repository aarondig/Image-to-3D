import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-svh w-full flex-col items-center px-4 pt-20"
    >
      <div className="flex w-full max-w-md flex-col justify-center gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="grid gap-1">
                <CardTitle>Something went wrong</CardTitle>
                <CardDescription>We couldn't generate your 3D model</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Failed to generate 3D model. Please try again.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={onRetry}
              size="default"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              If the problem persists, try a different photo
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
