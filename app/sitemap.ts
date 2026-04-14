import type { MetadataRoute } from 'next';

import { getProducts } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zivaad.com';
  const products = await getProducts();

  return [
    {
      url: baseUrl,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/collection`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date()
    },
    ...products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date()
    }))
  ];
}
