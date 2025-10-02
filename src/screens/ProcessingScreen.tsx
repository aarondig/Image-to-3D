import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface ProcessingScreenProps {
  image: string;
  progress: number;
  status: string;
}

export function ProcessingScreen({ image, progress, status }: ProcessingScreenProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-svh w-full flex-col items-center px-4 pt-20"
    >
      <div className="flex w-full max-w-lg flex-col justify-center gap-6">
        {/* Main Processing Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                <img
                  src={image}
                  alt="Processing"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status}
                </CardTitle>
                <CardDescription>
                  This usually takes 30-90 seconds
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* Progress Bar */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>

            {/* 3D Preview Placeholder */}
            <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted/30">
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="grid w-full max-w-[200px] gap-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
