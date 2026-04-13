import Link from 'next/link';

import { optimizeCloudinaryVideo } from '@/lib/cloudinary';

interface VideoShowcaseSectionProps {
  videoUrl?: string;
}

export function VideoShowcaseSection({ videoUrl = 'https://res.cloudinary.com/demo/video/upload/v1690000000/dog.mp4' }: VideoShowcaseSectionProps) {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
      <div className="grid items-stretch overflow-hidden border border-stone-200 bg-[#fcfcfb] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <p className="text-[10px] uppercase tracking-luxury text-stone-500">Brand Story</p>
          <h2 className="mt-4 font-serif text-[1.72rem] leading-[1.05] text-stone-950 sm:text-[2.2rem]">
            Refined Texture
          </h2>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-stone-500">Designed for Lasting Presence</p>
          <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-stone-600">
            Every ZIVAAD piece is selected for finish, comfort, and timeless wearability. We focus on clean silhouettes that
            layer effortlessly and hold their presence from day to evening.
          </p>
          <ul className="mt-6 space-y-2 text-[11px] uppercase tracking-luxury text-stone-600">
            <li>Premium anti-tarnish finish</li>
            <li>Curated styles for daily wear</li>
            <li>Luxury look with practical comfort</li>
          </ul>

          <div className="mt-7">
            <Link
              href="/about"
              className="inline-flex border border-stone-950 px-6 py-2.5 text-[11px] uppercase tracking-luxury text-stone-950 transition-colors hover:bg-stone-950 hover:text-white"
            >
              Read Our Story
            </Link>
          </div>
        </div>

        <div className="relative bg-stone-100">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-[52vh] min-h-[320px] w-full object-cover sm:h-[58vh] lg:h-full lg:min-h-[540px]"
          >
            <source src={optimizeCloudinaryVideo(videoUrl, 1920)} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
