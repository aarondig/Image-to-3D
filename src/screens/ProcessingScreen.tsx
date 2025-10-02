import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Sparkles } from 'lucide-react';

interface ProcessingScreenProps {
  image: string;
  progress: number;
  status: string;
}

export function ProcessingScreen({ image, progress, status }: ProcessingScreenProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Generating 3D Model
          </Badge>
        </div>

        {/* Main Processing Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={image}
                  alt="Processing"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                  <p className="text-sm sm:text-base font-medium truncate">{status}</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This usually takes 30-90 seconds
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* 3D Preview Placeholder */}
            <div className="pt-4">
              <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted/50 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6">
                  <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg" />
                  <div className="space-y-2 w-full max-w-[200px]">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4 mx-auto" />
                  </div>
                </div>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent animate-shimmer" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
