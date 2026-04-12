interface Testimonial {
  id: string;
  name: string;
  text: string;
  verified?: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: 'review-1',
    name: 'Maryam Z.',
    verified: true,
    text: 'I am very satisfied with my parcel. It arrived on time and exactly as described.'
  },
  {
    id: 'review-2',
    name: 'Ahmad',
    verified: true,
    text: 'Great product. Packaging and quality both are excellent.'
  },
  {
    id: 'review-3',
    name: 'Amna',
    verified: true,
    text: 'Loved this complete set. Looks elegant and feels premium.'
  },
  {
    id: 'review-4',
    name: 'Maheen',
    verified: true,
    text: 'Quality is very good and delivery was timely. Highly recommended.'
  },
  {
    id: 'review-5',
    name: 'Mehwish',
    verified: true,
    text: 'These are too good. I liked it very much and polish is smooth.'
  },
  {
    id: 'review-6',
    name: 'Khadija',
    verified: true,
    text: 'Received my parcel today. Same as shown and finishing is very neat.'
  },
  {
    id: 'review-7',
    name: 'Aiman',
    verified: true,
    text: 'First time ordering and fully satisfied. Shine is beautiful.'
  },
  {
    id: 'review-8',
    name: 'Bushra',
    verified: true,
    text: '100/100 loved them, fit nicely and look elegant on hand.'
  }
];

const firstRow = testimonials.slice(0, 5);
const secondRow = testimonials.slice(5);

function Stars() {
  return (
    <div className="flex items-center gap-0.5 text-[#f59e0b]">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
          <path d="M10 1.7l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L10 1.7z" />
        </svg>
      ))}
    </div>
  );
}

function VerifiedIcon() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-800 text-white">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 10l3 3 7-7" />
      </svg>
    </span>
  );
}

function getNameInitial(name: string): string {
  const letter = name.trim().match(/[A-Za-z]/)?.[0];
  return letter ? letter.toUpperCase() : 'Z';
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="w-[min(86vw,520px)] shrink-0 rounded-[1.8rem] border border-stone-100 bg-[#f9f9f8] px-4 py-3 shadow-[0_5px_18px_rgba(17,17,17,0.05)] sm:w-[min(47vw,540px)] sm:px-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white font-serif text-lg text-stone-800">
          {getNameInitial(testimonial.name)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[18px] leading-none text-stone-900">{testimonial.name}</p>
            {testimonial.verified ? <VerifiedIcon /> : null}
            <Stars />
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-stone-700">{testimonial.text}</p>
        </div>
      </div>
    </article>
  );
}

interface MarqueeRowProps {
  items: Testimonial[];
  reverse?: boolean;
}

function MarqueeRow({ items, reverse = false }: MarqueeRowProps) {
  const loopItems = [...items, ...items];

  return (
    <div className="zivaad-review-marquee overflow-hidden">
      <div
        className={`zivaad-review-track ${reverse ? 'zivaad-review-track-reverse' : 'zivaad-review-track-forward'} flex w-max gap-3 sm:gap-4`}
      >
        {loopItems.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}

export function CustomerLoveSection() {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6 sm:py-14 lg:px-6 lg:py-16">
      <div className="mb-6 text-center sm:mb-8">
        <h2 className="font-serif text-[1.72rem] text-stone-950 sm:text-[2.2rem]">Our customers love us</h2>
        <p className="mt-2 text-[13px] font-medium text-stone-700 sm:text-base">5.0 star based on 761 reviews</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <MarqueeRow items={firstRow} />
        <MarqueeRow items={secondRow} reverse />
      </div>
    </section>
  );
}
