import Link from 'next/link';

export default function AdminProductNotFoundPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 text-center sm:px-6">
      <h1 className="font-serif text-4xl text-stone-950">Product Not Found</h1>
      <p className="mt-3 text-sm text-stone-600">This product does not exist in your current catalog data.</p>
      <Link
        href="/admin"
        className="mt-6 inline-flex border border-stone-300 px-4 py-2 text-[10px] uppercase tracking-luxury text-stone-700"
      >
        Back to Admin
      </Link>
    </section>
  );
}

