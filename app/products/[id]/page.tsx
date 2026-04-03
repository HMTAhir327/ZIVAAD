import { redirect } from 'next/navigation';

interface LegacyProductPageProps {
  params: {
    id: string;
  };
}

export default function LegacyProductPage({ params }: LegacyProductPageProps) {
  redirect(`/product/${params.id}`);
}
