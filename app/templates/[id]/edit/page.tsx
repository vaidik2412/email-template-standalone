import TemplateFormScreen from '@/components/templates/TemplateFormScreen';

type EditTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const resolvedParams = await params;

  return <TemplateFormScreen mode='edit' templateId={resolvedParams.id} />;
}
