import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '24px',
          background: 'white',
          padding: '48px',
          boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', color: '#475569', letterSpacing: '0.08em' }}>
          Standalone Prototype
        </p>
        <h1 style={{ margin: '12px 0 16px', fontSize: '40px', lineHeight: 1.1 }}>
          Email template manager
        </h1>
        <p style={{ margin: 0, fontSize: '18px', lineHeight: 1.6, color: '#334155' }}>
          A standalone single-business app that mirrors Lydia&apos;s email template flows.
        </p>
        <Link
          href='/templates'
          style={{
            display: 'inline-flex',
            marginTop: '28px',
            padding: '14px 18px',
            borderRadius: '999px',
            background: '#1d4ed8',
            color: 'white',
            fontWeight: 600,
          }}
        >
          Email Templates Dashboard
        </Link>
      </div>
    </main>
  );
}
