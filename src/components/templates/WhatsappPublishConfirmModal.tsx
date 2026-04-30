'use client';

import React, { useEffect } from 'react';

type WhatsappPublishConfirmModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function WhatsappPublishConfirmModal({
  isOpen,
  isSubmitting,
  onCancel,
  onConfirm,
}: WhatsappPublishConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className='wa-confirm-modal-backdrop'
      role='dialog'
      aria-modal='true'
      aria-labelledby='wa-confirm-title'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div className='wa-confirm-modal'>
        <div className='wa-confirm-modal-icon' aria-hidden>
          <svg width='28' height='28' viewBox='0 0 90 90' fill='none'>
            <path
              fill='#25D366'
              d='M90 43.84C90 68.05 70.04 87.68 45.43 87.68a45 45 0 01-21.7-5.55L0 90l7.99-23.54a43.27 43.27 0 01-6.07-22.62C1.92 19.63 21.88 0 46.49 0 71.1 0 90 19.63 90 43.84z'
            />
            <path
              fill='#fff'
              d='M22.07 64.22l4.84-17.6a33.86 33.86 0 01-4.55-17.04C22.36 13.42 35.52.84 51.7.84c7.85 0 15.22 3 20.77 8.45a28.05 28.05 0 018.6 20.3c-.01 15.94-13.16 28.96-29.36 28.96h-.02a30 30 0 01-14.16-3.55l-15.46 4.04zm17.92-10.85l.93.53a25.04 25.04 0 0012.94 3.5h.01c13.45 0 24.4-10.83 24.4-24.13 0-6.45-2.55-12.5-7.16-17.06a24.4 24.4 0 00-17.23-7.07c-13.46 0-24.4 10.84-24.4 24.13 0 4.55 1.3 9 3.74 12.83l.58.92-2.86 10.4 10.05-2.7z'
            />
          </svg>
        </div>
        <h2 className='wa-confirm-modal-title' id='wa-confirm-title'>
          Submit template to WhatsApp?
        </h2>
        <p className='wa-confirm-modal-body'>
          This template will be created on your WhatsApp Business account and sent to Meta for
          approval. Approval typically takes a few minutes to a few hours.
        </p>
        <p className='wa-confirm-modal-warning'>
          <strong>Once approved, the template can no longer be edited.</strong> If it&apos;s
          rejected, you&apos;ll be able to edit and resubmit.
        </p>
        <div className='wa-confirm-modal-actions'>
          <button
            type='button'
            className='wa-confirm-modal-cancel'
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='button'
            className='wa-confirm-modal-confirm'
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </div>
    </div>
  );
}
