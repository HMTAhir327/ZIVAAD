import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Size Guide | ZIVAAD',
  description: 'Find your perfect fit with our comprehensive size guide for rings, bracelets, and necklaces.',
};

export default function SizeGuidePage() {
  return (
    <main className="bg-white px-4 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-3xl tracking-wide text-stone-900 sm:text-4xl">Size Guide</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">Find your perfect fit</p>
        </div>

        {/* Ring Sizes */}
        <section className="border-t border-stone-200 pt-8 mt-8">
          <h2 className="font-serif text-xl tracking-wide text-stone-900">Ring Sizes</h2>
          <p className="mt-2 text-sm text-stone-500">US / Pakistan standard sizing</p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-stone-700">
              <thead>
                <tr className="border-b border-stone-300 text-left text-[11px] uppercase tracking-widest text-stone-500">
                  <th className="border border-stone-200 px-4 py-3">Size</th>
                  <th className="border border-stone-200 px-4 py-3">Inner Diameter (mm)</th>
                  <th className="border border-stone-200 px-4 py-3">Inner Circumference (mm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: '5', diameter: '15.7', circumference: '49.3' },
                  { size: '6', diameter: '16.5', circumference: '51.8' },
                  { size: '7', diameter: '17.3', circumference: '54.4' },
                  { size: '8', diameter: '18.1', circumference: '56.9' },
                  { size: '9', diameter: '18.9', circumference: '59.5' },
                  { size: '10', diameter: '19.8', circumference: '62.1' },
                ].map((row) => (
                  <tr key={row.size} className="transition-colors hover:bg-stone-50">
                    <td className="border border-stone-200 px-4 py-3 font-medium text-stone-900">{row.size}</td>
                    <td className="border border-stone-200 px-4 py-3">{row.diameter}</td>
                    <td className="border border-stone-200 px-4 py-3">{row.circumference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-sm leading-relaxed text-stone-600">
              <span className="font-medium text-stone-800">Tip:</span> Wrap a strip of paper around your finger, mark where it meets, measure the length in mm and match to the circumference column above.
            </p>
          </div>
        </section>

        {/* Bracelet Sizes */}
        <section className="border-t border-stone-200 pt-8 mt-8">
          <h2 className="font-serif text-xl tracking-wide text-stone-900">Bracelet Sizes</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-stone-700">
              <thead>
                <tr className="border-b border-stone-300 text-left text-[11px] uppercase tracking-widest text-stone-500">
                  <th className="border border-stone-200 px-4 py-3">Size</th>
                  <th className="border border-stone-200 px-4 py-3">Wrist Circumference (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'Small', wrist: '15 - 16' },
                  { size: 'Medium', wrist: '16.5 - 17.5' },
                  { size: 'Large', wrist: '18 - 19' },
                ].map((row) => (
                  <tr key={row.size} className="transition-colors hover:bg-stone-50">
                    <td className="border border-stone-200 px-4 py-3 font-medium text-stone-900">{row.size}</td>
                    <td className="border border-stone-200 px-4 py-3">{row.wrist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-sm leading-relaxed text-stone-600">
              <span className="font-medium text-stone-800">Tip:</span> Measure around your wrist with a flexible tape. Add 1-2 cm for comfort.
            </p>
          </div>
        </section>

        {/* Necklace Lengths */}
        <section className="border-t border-stone-200 pt-8 mt-8">
          <h2 className="font-serif text-xl tracking-wide text-stone-900">Necklace Lengths</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-stone-700">
              <thead>
                <tr className="border-b border-stone-300 text-left text-[11px] uppercase tracking-widest text-stone-500">
                  <th className="border border-stone-200 px-4 py-3">Style</th>
                  <th className="border border-stone-200 px-4 py-3">Length</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { style: 'Choker', length: '35 - 40 cm' },
                  { style: 'Princess', length: '43 - 48 cm' },
                  { style: 'Matinee', length: '50 - 60 cm' },
                  { style: 'Opera', length: '70 - 85 cm' },
                ].map((row) => (
                  <tr key={row.style} className="transition-colors hover:bg-stone-50">
                    <td className="border border-stone-200 px-4 py-3 font-medium text-stone-900">{row.style}</td>
                    <td className="border border-stone-200 px-4 py-3">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Earring Care */}
        <section className="border-t border-stone-200 pt-8 mt-8">
          <h2 className="font-serif text-xl tracking-wide text-stone-900">Earring Care</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            To keep your earrings looking their best, avoid contact with perfumes, lotions, and water. Store them in a
            soft pouch or lined jewellery box when not in use. Gently wipe with a dry microfibre cloth after each wear
            to maintain their lustre.
          </p>
        </section>

        {/* Back to Shop */}
        <div className="border-t border-stone-200 pt-8 mt-8 text-center">
          <Link
            href="/shop"
            className="inline-block text-[11px] uppercase tracking-widest text-stone-700 underline underline-offset-4 transition-colors hover:text-[#b89a61]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
