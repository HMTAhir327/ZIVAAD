'use client';

import { motion } from 'framer-motion';

export function BrandStory() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-xs uppercase tracking-luxury text-stone-500"
      >
        Brand Story
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl"
      >
        Quiet luxury, shaped for everyday ritual.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base"
      >
        ZIVAAD was built for those who choose precision over excess. Each piece balances clean geometry,
        skin-friendly finish, and a modern heirloom feel designed to layer effortlessly from morning coffee to
        evening events.
      </motion.p>
    </section>
  );
}
