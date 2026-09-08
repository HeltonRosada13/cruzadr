import { getChurchDataServer } from '@/lib/churchDataServer';
import { ChurchProvider } from '@/lib/ChurchContext';
import { PageContent } from '@/components/PageContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const initialData = await getChurchDataServer();

  return (
    <ChurchProvider initialData={initialData}>
      <PageContent />
    </ChurchProvider>
  );
}
