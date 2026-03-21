import mongoose from 'mongoose';

const COLLECTION_NAME = 'messageTemplates';
const FIXED_BUSINESS_ID = '66ef0bf7bb00000000000001';
const FIXED_USER_ID = '66ef0bf7bb00000000000002';

const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: 'Lead Inquiry Response',
    templateType: 'SALES_CRM',
    subject: 'Regarding your requirement for {{company.name}}',
    body:
      'Hello {{contact.name}},\nHow are you doing?\nThis is {{my.name}} this side from {{business.name}}.\nWe have received your inquiry about the requirements you have for {{company.name}}.\nI wanted to understand these requirements better. Can you let me know what would be a good time to discuss this over a call?',
  },
  {
    name: 'Lead Follow-up Email',
    templateType: 'SALES_CRM',
    subject: 'Following up on your requirement for {{company.name}}',
    body:
      "Hello {{contact.name}},\n{{my.name}} here from {{business.name}}.\nI just wanted to follow up on our last conversation.\nI'm eager to know if you've had a chance to consider our discussion and if there are any further questions I can answer.\nIf it’s convenient for you, we could schedule another call to go over any specifics or concerns you might have.\nLooking forward to hearing from you.",
  },
  {
    name: 'Upcoming Meeting Reminder',
    templateType: 'SALES_CRM',
    subject: 'Reminder: upcoming meeting with {{company.name}}',
    body:
      'Hello {{contact.name}},\nJust a quick reminder about our upcoming meeting scheduled for _\\[Date\\]_ at _\\[Time\\]_.\nPlease let me know if this time still works for you or if any adjustments are needed.\nLooking forward to our conversation.',
  },
  {
    name: 'Missed Meeting Check-In',
    templateType: 'SALES_CRM',
    subject: '{{contact.name}}, should we reschedule our meeting?',
    body:
      "Hello {{contact.name}},\nI noticed that we missed our scheduled meeting. I hope everything is alright on your end.\nI understand that schedules can get busy, and I would be more than happy to find a new time that works better for you.\nPlease let me know your availability, and I'll arrange for a reschedule at your earliest convenience.\nLooking forward to hearing from you.",
  },
  {
    name: 'Share Product Details',
    templateType: 'SALES_CRM',
    subject: 'Our offerings for {{company.name}}',
    body:
      'Dear {{contact.name}},\nThank you for showing interest in our products at {{business.name}}.\nAt {{business.name}}, We provide products such as.....\nFor a detailed overview, you can visit \\[link to product details page or _\\[brochure\\]_.\nDo feel free to ask any questions you might have.',
  },
  {
    name: 'Feedback Request For Lost Leads',
    templateType: 'SALES_CRM',
    subject: 'Would you like to give any feedback?',
    body:
      "Dear {{contact.name}},\nI'm reaching out to understand more about your decision regarding our offerings.\nWhile we're disappointed that we won't be working together at this time, we genuinely value your insights.\nYour feedback about what led to your decision not to proceed with us, or any areas we could improve, would be incredibly helpful.\nThank you for considering {{business.name}}, and we hope to have the opportunity to serve {{company.name}} in the future.\nLooking forward to hearing from you.",
  },
  {
    name: 'Take The Conversation Forward',
    templateType: 'SALES_CRM',
    subject: 'Moving Forward: Next Steps for {{company.name}}',
    body:
      "Hello {{contact.name}},\nIt was great speaking with you about how {{business.name}} can add value to {{company.name}}.\nAs discussed, the next steps would be:\n1.  We will schedule a free demo for your team.\n2.  Understand your requirements\n3.  Send a detailed Proposal\nPlease let me know a convenient time for you to proceed or if there's any other information you require.",
  },
];

function requireMongoUri() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  return mongodbUri;
}

async function ensureCollection(db) {
  const existingCollections = await db.listCollections({ name: COLLECTION_NAME }).toArray();

  if (!existingCollections.length) {
    await db.createCollection(COLLECTION_NAME);
  }

  return db.collection(COLLECTION_NAME);
}

function buildLiveDefaultTemplate(template) {
  const businessId = new mongoose.Types.ObjectId(FIXED_BUSINESS_ID);
  const userId = new mongoose.Types.ObjectId(FIXED_USER_ID);
  const now = new Date();

  return {
    ...template,
    published: {
      name: template.name,
      subject: template.subject,
      body: template.body,
    },
    status: 'LIVE',
    channel: 'EMAIL',
    isModifiedPostPublish: false,
    lastPublished: now,
    business: businessId,
    createdBy: userId,
    isDefault: true,
    isArchived: false,
    isRemoved: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function main() {
  const mongodbUri = requireMongoUri();
  const dropExisting = process.argv.includes('--drop-existing');

  await mongoose.connect(mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const db = mongoose.connection.db;
    const businessId = new mongoose.Types.ObjectId(FIXED_BUSINESS_ID);

    if (dropExisting) {
      const existingCollections = await db.listCollections({ name: COLLECTION_NAME }).toArray();

      if (existingCollections.length) {
        await db.collection(COLLECTION_NAME).deleteMany({
          business: businessId,
        });
      }
    }

    const collection = await ensureCollection(db);

    await collection.createIndexes([
      { key: { business: 1 }, name: 'business_1' },
      { key: { createdBy: 1 }, name: 'createdBy_1' },
      { key: { templateType: 1 }, name: 'templateType_1' },
      { key: { 'archived.by': 1 }, name: 'archived.by_1' },
      { key: { 'removed.by': 1 }, name: 'removed.by_1' },
    ]);

    const existingDefault = await collection.findOne({
      business: businessId,
      channel: 'EMAIL',
      isDefault: true,
    });

    let seededCount = 0;

    if (!existingDefault) {
      const documents = DEFAULT_EMAIL_TEMPLATES.map(buildLiveDefaultTemplate);
      const result = await collection.insertMany(documents);
      seededCount = result.insertedCount;
    }

    const totalTemplates = await collection.countDocuments({
      business: businessId,
      channel: 'EMAIL',
    });

    console.log(
      JSON.stringify(
        {
          database: db.databaseName,
          collection: COLLECTION_NAME,
          businessId: FIXED_BUSINESS_ID,
          seededCount,
          totalTemplates,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
