import { AdminEditor } from '@/components/admin-editor';
import { getAdminWriteBlockMessage, isAdminWriteEnabled } from '@/lib/admin-mode';
import { getProducts } from '@/lib/products';
import { DEFAULT_SITE_CONTENT, getSiteContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminPage() {
  const adminCanWrite = isAdminWriteEnabled();
  const adminWriteNotice = adminCanWrite
    ? 'Local write mode is active. Saving updates writes to data/products.json and data/site-content.json.'
    : getAdminWriteBlockMessage();

  try {
    const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);
    return (
      <AdminEditor
        initialProducts={products}
        initialSiteContent={siteContent}
        adminCanWrite={adminCanWrite}
        adminWriteNotice={adminWriteNotice}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error loading products';

    return (
      <section className="w-full px-6 py-12 sm:px-8 lg:px-10">
        <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Admin loaded with fallback. Product data failed to load: {message}
        </div>
        <AdminEditor
          initialProducts={[]}
          initialSiteContent={DEFAULT_SITE_CONTENT}
          adminCanWrite={adminCanWrite}
          adminWriteNotice={adminWriteNotice}
        />
      </section>
    );
  }
}
