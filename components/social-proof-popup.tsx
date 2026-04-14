'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { optimizeCloudinaryImage } from '@/lib/cloudinary';

interface CatalogProduct {
  id: string;
  name: string;
  primary_image_url: string;
  category: string;
}

interface Profile {
  id: string;
  name: string;
}

const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan'
];

const TIME_STRINGS = [
  'just now', '2 min ago', '5 min ago', '12 min ago', '25 min ago',
  '1 hour ago', '2 hours ago', '3 hours ago', '5 hours ago', '6 hours ago'
];

type NotificationType = 'order' | 'viewing' | 'cart';

interface NotificationData {
  type: NotificationType;
  message: string;
  timeAgo?: string;
  imageUrl?: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function SocialProofPopup() {
  const pathname = usePathname();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProductRef = useRef<string>('');
  const lastNameRef = useRef<string>('');

  // Don't show on admin pages
  const isAdmin = pathname.startsWith('/admin');

  // Fetch catalog and profiles on mount
  useEffect(() => {
    if (isAdmin) return;
    let active = true;

    fetch('/api/catalog')
      .then((res) => res.json())
      .then((data) => { if (active && data.ok) setProducts(data.products || []); })
      .catch(() => {});

    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => { if (active && data.ok) setProfiles(data.profiles || []); })
      .catch(() => {});

    return () => { active = false; };
  }, [isAdmin]);

  const generateNotification = useCallback((): NotificationData | null => {
    if (products.length === 0) return null;

    const types: NotificationType[] = ['order', 'viewing', 'cart'];
    const type = pickRandom(types);

    if (type === 'viewing') {
      const count = randomBetween(8, 24);
      return { type, message: `${count} people are viewing this right now` };
    }

    // For order and cart, pick a product and name
    let product = pickRandom(products);
    let attempts = 0;
    while (product.id === lastProductRef.current && products.length > 1 && attempts < 5) {
      product = pickRandom(products);
      attempts++;
    }
    lastProductRef.current = product.id;

    let name = profiles.length > 0 ? pickRandom(profiles).name : 'Someone';
    attempts = 0;
    while (name === lastNameRef.current && profiles.length > 1 && attempts < 5) {
      name = profiles.length > 0 ? pickRandom(profiles).name : 'Someone';
      attempts++;
    }
    lastNameRef.current = name;

    const city = pickRandom(CITIES);
    const timeAgo = pickRandom(TIME_STRINGS);
    const imageUrl = product.primary_image_url
      ? optimizeCloudinaryImage(product.primary_image_url, 80)
      : undefined;

    if (type === 'order') {
      return {
        type,
        message: `${name} from ${city} just ordered ${product.name}`,
        timeAgo,
        imageUrl
      };
    }

    return {
      type,
      message: `${name} from ${city} added ${product.name} to cart`,
      timeAgo,
      imageUrl
    };
  }, [products, profiles]);

  const showNext = useCallback(() => {
    const data = generateNotification();
    if (!data) return;

    setNotification(data);
    setVisible(true);

    // Hide after 5 seconds
    timerRef.current = setTimeout(() => {
      setVisible(false);

      // After fade out animation (~300ms), schedule next
      timerRef.current = setTimeout(() => {
        const delay = randomBetween(15000, 30000);
        timerRef.current = setTimeout(showNext, delay);
      }, 400);
    }, 5000);
  }, [generateNotification]);

  // Start the cycle
  useEffect(() => {
    if (isAdmin || products.length === 0) return;

    const initialDelay = randomBetween(8000, 12000);
    timerRef.current = setTimeout(showNext, initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAdmin, products.length, showNext]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    // Schedule next after dismiss
    timerRef.current = setTimeout(() => {
      const delay = randomBetween(15000, 30000);
      timerRef.current = setTimeout(showNext, delay);
    }, 400);
  }, [showNext]);

  if (isAdmin) return null;

  return (
    <div className="fixed bottom-14 left-3 sm:bottom-16 sm:left-5 z-[94]">
      <AnimatePresence>
        {visible && notification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
            style={{ maxWidth: 320 }}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              aria-label="Close notification"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l8 8M9 1l-8 8" />
              </svg>
            </button>

            {/* Product image */}
            {notification.imageUrl && (
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-stone-50">
                <Image
                  src={notification.imageUrl}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* Text content */}
            <div className="flex-1 pr-4">
              <p className="text-xs leading-snug text-stone-700">
                {notification.message}
              </p>
              {notification.timeAgo && (
                <p className="mt-0.5 text-[10px] text-stone-400">
                  {notification.timeAgo}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
