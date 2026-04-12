import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-luxury text-stone-500">404</p>
      <h1 className="mt-4 font-serif text-[2rem] text-stone-950 sm:text-5xl">Product Not Found</h1>
      <p className="mt-4 max-w-md text-sm text-stone-600">
        The piece you are looking for is no longer available or has moved.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-flex rounded-full bg-stone-950 px-7 py-3 text-xs uppercase tracking-luxury text-white"
      >
        Back to Shop
      </Link>
    </section>
  );
}
