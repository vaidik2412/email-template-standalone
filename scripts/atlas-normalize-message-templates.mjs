import mongoose from 'mongoose';

const TARGET_COLLECTION_NAME = 'messageTemplates';
const LEGACY_COLLECTION_NAME = 'messagetemplates';

function requireMongoUri() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  return mongodbUri;
}

function buildTemplateSignature(template) {
  return JSON.stringify({
    business: template.business ? String(template.business) : '',
    channel: template.channel || '',
    templateType: template.templateType || '',
    name: template.name || '',
    subject: template.subject || '',
    body: template.body || '',
    status: template.status || '',
    isDefault: Boolean(template.isDefault),
    isArchived: Boolean(template.isArchived),
    isRemoved: Boolean(template.isRemoved),
  });
}

async function ensureCollection(db, name) {
  const exists = await db.listCollections({ name }).hasNext();

  if (!exists) {
    await db.createCollection(name);
  }

  return db.collection(name);
}

async function main() {
  const mongodbUri = requireMongoUri();
  const keepLegacyCollection = process.argv.includes('--keep-legacy');

  await mongoose.connect(mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const db = mongoose.connection.db;
    const targetCollection = await ensureCollection(db, TARGET_COLLECTION_NAME);
    const legacyExists = await db.listCollections({ name: LEGACY_COLLECTION_NAME }).hasNext();

    if (!legacyExists) {
      console.log(
        JSON.stringify(
          {
            database: db.databaseName,
            targetCollection: TARGET_COLLECTION_NAME,
            legacyCollection: LEGACY_COLLECTION_NAME,
            legacyExists: false,
            insertedCount: 0,
            skippedCount: 0,
            droppedLegacyCollection: false,
          },
          null,
          2,
        ),
      );

      return;
    }

    const legacyCollection = db.collection(LEGACY_COLLECTION_NAME);
    const [targetDocuments, legacyDocuments] = await Promise.all([
      targetCollection.find({}).toArray(),
      legacyCollection.find({}).toArray(),
    ]);

    const existingTargetIds = new Set(targetDocuments.map((document) => String(document._id)));
    const existingSignatures = new Set(targetDocuments.map(buildTemplateSignature));

    const documentsToInsert = [];
    let skippedCount = 0;

    for (const document of legacyDocuments) {
      const documentId = String(document._id);
      const signature = buildTemplateSignature(document);

      if (existingTargetIds.has(documentId) || existingSignatures.has(signature)) {
        skippedCount += 1;
        continue;
      }

      documentsToInsert.push(document);
      existingTargetIds.add(documentId);
      existingSignatures.add(signature);
    }

    if (documentsToInsert.length) {
      await targetCollection.insertMany(documentsToInsert, {
        ordered: false,
      });
    }

    let droppedLegacyCollection = false;

    if (!keepLegacyCollection) {
      await legacyCollection.drop();
      droppedLegacyCollection = true;
    }

    console.log(
      JSON.stringify(
        {
          database: db.databaseName,
          targetCollection: TARGET_COLLECTION_NAME,
          legacyCollection: LEGACY_COLLECTION_NAME,
          legacyExists: true,
          targetCountBefore: targetDocuments.length,
          legacyCountBefore: legacyDocuments.length,
          insertedCount: documentsToInsert.length,
          skippedCount,
          targetCountAfter: await targetCollection.countDocuments({}),
          droppedLegacyCollection,
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
