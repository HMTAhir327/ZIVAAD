interface HomeTrustStripProps {
  items: string[];
}

const fallbackItems = ['Pure Stainless Steel', '20k+ Satisfied Customers', 'Cash on Delivery', 'WhatsApp Support'];

export function HomeTrustStrip({ items }: HomeTrustStripProps) {
  const normalizedItems = (items || []).map((item) => item.trim()).filter(Boolean);
  const marqueeItems = normalizedItems.length > 0 ? normalizedItems : fallbackItems;
  const loopItems = [...marqueeItems, ...marqueeItems];

  return (
    <section className="w-full border-b border-[#b69761] bg-[#b89a61]">
      <div className="zivaad-home-trust-marquee overflow-hidden">
        <div className="zivaad-home-trust-track flex w-max items-center gap-10 px-4 py-3 sm:gap-14 sm:px-6 sm:py-3.5 lg:px-10">
          {loopItems.map((item, index) => (
            <span key={`${item}-${index}`} className="whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.2em] text-[#fffaf0] sm:text-[13px]">
              ✦&ensp;{item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
