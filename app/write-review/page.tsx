import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Write a Review | ZIVAAD'
};

export default function WriteReviewPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-6xl font-medium text-stone-300 sm:text-7xl">500</p>
        <h1 className="mt-4 font-serif text-[1.8rem] leading-tight text-stone-950 sm:text-3xl">
          Something Went Wrong
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          We&apos;re experiencing a temporary issue with our review system. Our team has been notified and is actively working on a fix. Please try again later.
        </p>
        <p className="mt-3 text-xs text-stone-400">Error code: RV-500 · Review service unavailable</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center bg-stone-950 px-6 py-3 text-[11px] uppercase tracking-luxury text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center border border-stone-300 px-6 py-3 text-[11px] uppercase tracking-luxury text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950 sm:w-auto"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
