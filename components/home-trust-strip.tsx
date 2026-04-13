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
        <div className="zivaad-home-trust-track flex w-max items-center gap-8 px-4 py-2 sm:gap-10 sm:px-6 lg:px-10">
          {loopItems.map((item, index) => (
            <span key={`${item}-${index}`} className="whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-[#fffaf0]">
              ✦ {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
