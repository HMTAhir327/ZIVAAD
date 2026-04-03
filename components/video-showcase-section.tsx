import { optimizeCloudinaryVideo } from '@/lib/cloudinary';

interface VideoShowcaseSectionProps {
  videoUrl?: string;
}

export function VideoShowcaseSection({ videoUrl = 'https://res.cloudinary.com/demo/video/upload/v1690000000/dog.mp4' }: VideoShowcaseSectionProps) {
  return (
    <section className="mx-auto w-full max-w-[1320px]">
      <div className="overflow-hidden bg-stone-100">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-[56vh] min-h-[340px] max-h-[520px] w-full object-cover sm:h-[560px]"
        >
          <source src={optimizeCloudinaryVideo(videoUrl, 1920)} type="video/mp4" />
        </video>
      </div>
    </section>
  );
}
