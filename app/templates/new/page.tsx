import TemplateFormScreen from '@/components/templates/TemplateFormScreen';

type NewTemplatePageProps = {
  searchParams?: Promise<{
    copyFrom?: string;
  }>;
};

export default async function NewTemplatePage({ searchParams }: NewTemplatePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <TemplateFormScreen mode='create' copyFromId={resolvedSearchParams?.copyFrom} />;
}
