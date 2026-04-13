'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { SiteContent } from '@/lib/types';

interface HomeHeroProps {
  hero: SiteContent['hero'];
}

export function HomeHero({ hero }: HomeHeroProps) {
  const subtitle = hero.subtitle.trim();

  return (
    <section className="relative isolate flex min-h-[72vh] w-full items-center overflow-hidden border-b border-stone-200 bg-black sm:min-h-[84vh] lg:min-h-[95vh]">
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1.07 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src={optimizeCloudinaryImage(hero.image_url, 2200)}
          alt="ZIVAAD hero"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75"
        />
      </motion.div>

      {hero.gradient_enabled ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              hero.overlay_gradient ||
              'linear-gradient(to top, rgba(0,0,0,0.70), rgba(0,0,0,0.25), rgba(0,0,0,0.15))'
          }}
        />
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full px-5 pb-14 pt-14 text-center text-white sm:px-8 sm:pb-16 sm:pt-20 lg:px-10"
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/75 sm:text-[11px]">{hero.eyebrow}</p>
        <h1 className="mx-auto mt-3 max-w-[13ch] font-serif text-[2.18rem] leading-[0.94] sm:mt-4 sm:text-6xl md:text-7xl">
          {hero.title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-white/85 sm:mt-5 sm:text-base">
            {subtitle}
          </p>
        ) : null}
        <div className={`${subtitle ? 'mt-7 sm:mt-9' : 'mt-5 sm:mt-7'} flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-3`}>
          <Link
            href={hero.primary_cta_href}
            className="inline-flex w-full items-center justify-center bg-white px-8 py-3.5 text-[11px] uppercase tracking-luxury text-stone-950 transition-colors hover:bg-stone-100 sm:w-auto sm:min-w-[170px] sm:text-xs"
          >
            {hero.primary_cta_label}
          </Link>
          <Link
            href={hero.secondary_cta_href}
            className="inline-flex w-full items-center justify-center px-2 py-2 text-[10px] uppercase tracking-luxury text-white/92 transition-colors hover:text-white sm:w-auto sm:text-[11px]"
          >
            {hero.secondary_cta_label}
            <span className="ml-1.5">→</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
