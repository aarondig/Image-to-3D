import { motion } from 'framer-motion';
import { PreviewCanvas } from '@/components/PreviewCanvas';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

interface HomeScreenProps {
  onGetStarted: () => void;
}

export function HomeScreen({ onGetStarted }: HomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-start relative w-full min-h-screen"
    >
      <Header />

      <Breadcrumb items={['Upload', 'Generate', 'View']} activeIndex={-1} />

      {/* Canvas / Main Content */}
      <div className="bg-neutral-900 box-border flex flex-col gap-[40px] items-start pb-[40px] pt-[24px] px-[24px] relative shrink-0 w-full">
        <div className="w-full max-w-md mx-auto flex flex-col gap-[40px]">
          {/* Hero Text */}
          <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              <h1 className="font-semibold text-[36px] leading-[40px] text-white w-full">
                Photo 3D
              </h1>
              <p className="font-normal text-[16px] leading-[24px] text-neutral-400 w-full">
                Transform any photo (under 10mb) into an interactive 3D model. Don't sue me.
              </p>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-[#1e1e1e] box-border flex flex-col gap-[24px] h-[270px] items-center justify-center px-0 py-[24px] relative rounded-[24px] shrink-0 w-full border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            <div className="h-[201px] relative shrink-0 w-[192px]">
              <PreviewCanvas modelUrl="/tripo_pbr_model_1788b5ec-a74f-49d5-882e-2013a09e4894.glb" />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onGetStarted}
            className="bg-neutral-50 box-border flex flex-col gap-[10px] items-center justify-center px-0 py-[12px] relative rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-neutral-100 transition-colors"
          >
            <div className="flex gap-[10px] items-center justify-center relative shrink-0">
              <p className="font-medium text-[14px] leading-[20px] text-neutral-900 whitespace-pre">
                Get Started
              </p>
            </div>
          </button>
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
