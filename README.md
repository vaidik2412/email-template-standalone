# Email Template Standalone

A standalone Next.js app that mirrors Lydia's email-template dashboard, create flow, and edit flow for a single fixed business with no auth.

## What It Includes

- `/templates` dashboard with list, edit, duplicate, archive, and remove actions
- `/templates/new` create flow with draft and publish behavior
- `/templates/[id]/edit` edit flow with publish-on-update behavior
- MongoDB Atlas persistence in the `messageTemplates` collection
- Talos-inspired schema defaults and Serana-inspired publish/archive/remove mutation semantics

## Local Run

1. Create `.env.local` from `.env.example`
2. Set `MONGODB_URI`
3. Run:

```bash
npm run dev
```

4. Open [http://localhost:3000/templates](http://localhost:3000/templates)

## Verification

```bash
npm test
npm run build
```

Or run both:

```bash
npm run verify
```

## Atlas Helpers

Bootstrap or seed the collection:

```bash
MONGODB_URI='your-uri' npm run atlas:seed
```

Inspect the collection:

```bash
MONGODB_URI='your-uri' npm run atlas:inspect
```

Reset the fixed-business documents and reseed defaults:

```bash
MONGODB_URI='your-uri' npm run atlas:bootstrap -- --drop-existing
```

## Fixed App Context

- Business URL key: `demo-business`
- Business name: `Refrens Demo Business`
- Collection name: `messageTemplates`
