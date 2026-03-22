import TemplateFormScreen from '@/components/templates/TemplateFormScreen';
import { getIndexedCustomFieldsSnapshot } from '@/server/templateVariables/service';

type NewTemplatePageProps = {
  searchParams?: Promise<{
    copyFrom?: string;
  }>;
};

export default async function NewTemplatePage({ searchParams }: NewTemplatePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const indexedCustomFields = await getIndexedCustomFieldsSnapshot();

  return (
    <TemplateFormScreen
      mode='create'
      copyFromId={resolvedSearchParams?.copyFrom}
      indexedCustomFields={indexedCustomFields}
    />
  );
}
