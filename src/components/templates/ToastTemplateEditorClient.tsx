'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Editor } from '@toast-ui/react-editor';
import type { EditorProps } from '@toast-ui/react-editor';

import { EMAIL_TEMPLATE_VARIABLE_OPTIONS, EMAIL_TEMPLATE_VARIABLE_KEYS } from '@/data/email/lmsVariables';

type ToastTemplateEditorClientProps = {
  value: string;
  onChange: (value: string) => void;
};

const VARIABLE_PATTERN = /\{\{[^}]+\.[^}]+\}\}/;

type WidgetRule = NonNullable<EditorProps['widgetRules']>[number];
type ToolbarItemOptions = Exclude<NonNullable<EditorProps['toolbarItems']>[number][number], string>;

export default function ToastTemplateEditorClient({
  value,
  onChange,
}: ToastTemplateEditorClientProps) {
  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    const editor = editorRef.current?.getInstance();

    if (!editor) {
      return;
    }

    const markdown = editor.getMarkdown();

    if (markdown !== value) {
      editor.setMarkdown(value || '', false);
    }
  }, [value]);

  const addVariableToolbarItem = useMemo<ToolbarItemOptions | null>(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    const toolbarButton = document.createElement('div');
    toolbarButton.className = 'editor-toolbar-btn';
    toolbarButton.innerHTML =
      "<span class='template-toolbar-button-plus'>+</span>Add variable";

    const popupBody = document.createElement('div');
    popupBody.className = 'template-variable-popup';

    EMAIL_TEMPLATE_VARIABLE_OPTIONS.forEach((option) => {
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'template-variable-popup-item';
      optionButton.textContent = option.label;
      optionButton.onclick = () => {
        editorRef.current?.getInstance().insertText(`{{${option.value}}}`);
      };
      popupBody.appendChild(optionButton);
    });

    return {
      name: 'Add variable',
      text: 'Add variable +',
      tooltip: 'Add variable',
      el: toolbarButton,
      popup: {
        body: popupBody,
      },
    };
  }, []);

  const widgetRules = useMemo<WidgetRule[]>(
    () => [
      {
        rule: VARIABLE_PATTERN,
        toDOM(text: string) {
          const span = document.createElement('span');
          const matched = text.match(VARIABLE_PATTERN)?.[0] || '';

          span.innerHTML = text;

          if (EMAIL_TEMPLATE_VARIABLE_KEYS.some((key) => matched === `{{${key}}}`)) {
            span.classList.add('highlighted-variable');
          }

          return span;
        },
      },
    ],
    [],
  );

  const toolbarItems = useMemo(
    () => [
      ['heading', 'bold', 'italic', 'strike', 'link'],
      ['hr', 'quote'],
      ['ul', 'ol', 'task', 'indent', 'outdent'],
      ['code'],
      addVariableToolbarItem ? [addVariableToolbarItem] : [],
    ],
    [addVariableToolbarItem],
  );

  return (
    <div className='template-editor-shell'>
      <Editor
        ref={editorRef}
        initialValue={value || ''}
        initialEditType='wysiwyg'
        previewStyle='tab'
        height='330px'
        minHeight='330px'
        placeholder='Write your email body'
        toolbarItems={toolbarItems}
        hideModeSwitch
        usageStatistics={false}
        autofocus={false}
        widgetRules={widgetRules}
        onChange={() => {
          onChange(editorRef.current?.getInstance().getMarkdown() || '');
        }}
      />
    </div>
  );
}
