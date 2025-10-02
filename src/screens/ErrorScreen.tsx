import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                Something went wrong
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error || 'Failed to generate 3D model. Please try again.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={onRetry}
              size="lg"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              If the problem persists, try a different photo
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
