'use client';

import React from 'react';
import { Viewer } from '@toast-ui/react-editor';

type ToastTemplateViewerClientProps = {
  value: string;
};

export default function ToastTemplateViewerClient({ value }: ToastTemplateViewerClientProps) {
  return (
    <div className='template-preview-viewer'>
      <Viewer key={value} initialValue={value} usageStatistics={false} />
    </div>
  );
}
