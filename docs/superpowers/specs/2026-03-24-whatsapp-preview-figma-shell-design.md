# WhatsApp Preview Figma Shell Design

## Goal

Restyle the WhatsApp preview so it looks like the provided Figma iPhone chat mock while continuing to render the user's actual WhatsApp template content inside one complete outgoing template card.

## Constraints

- Keep the current dynamic content model.
- Do not split the user's message into multiple WhatsApp bubbles.
- Preserve link resolution and CTA/share-link behavior.
- Preserve the existing empty state when no message has been authored.
- Keep the work scoped to the WhatsApp preview component, its tests, and shared styling.

## Approved Direction

### Shell

The preview should become a literal phone-like WhatsApp canvas with:

- a 375x812 iPhone-style frame
- an iOS status bar
- a WhatsApp contact header inspired by the Figma layout
- a wallpaper-like chat area using the light gray Figma palette
- a composer bar and home indicator at the bottom

### Message Rendering

The user's resolved template body remains one large outgoing template card inside the chat area.

- All resolved paragraphs render inside the same card.
- Inline links remain inline within the card copy.
- The derived CTA/share link remains attached to that same card as its action/footer treatment.
- The card should visually match the softer WhatsApp/iOS treatment from the Figma mock.

### Empty State

When no content exists yet, keep the empty hint but present it inside the chat canvas so it feels part of the redesigned phone preview.

## Impacted Files

- `src/components/templates/TemplateWhatsappPreview.tsx`
- `src/components/templates/__tests__/TemplateWhatsappPreview.test.tsx`
- `app/globals.css`
