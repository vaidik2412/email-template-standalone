import TemplateFormScreen from '@/components/templates/TemplateFormScreen';
import { getIndexedCustomFieldsSnapshot } from '@/server/templateVariables/service';

type EditTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const resolvedParams = await params;
  const indexedCustomFields = await getIndexedCustomFieldsSnapshot();

  return (
    <TemplateFormScreen
      mode='edit'
      templateId={resolvedParams.id}
      indexedCustomFields={indexedCustomFields}
    />
  );
}
