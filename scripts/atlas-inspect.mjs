import mongoose from 'mongoose';

const COLLECTION_NAME = 'messageTemplates';
const FIXED_BUSINESS_ID = '66ef0bf7bb00000000000001';

function requireMongoUri() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  return mongodbUri;
}

async function main() {
  const mongodbUri = requireMongoUri();

  await mongoose.connect(mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const db = mongoose.connection.db;
    const businessId = new mongoose.Types.ObjectId(FIXED_BUSINESS_ID);
    const existingCollections = await db.listCollections({ name: COLLECTION_NAME }).toArray();

    if (!existingCollections.length) {
      console.log(
        JSON.stringify(
          {
            database: db.databaseName,
            collection: COLLECTION_NAME,
            exists: false,
            totalTemplates: 0,
            visibleTemplates: 0,
            latestTemplates: [],
          },
          null,
          2,
        ),
      );

      return;
    }

    const collection = db.collection(COLLECTION_NAME);
    const totalTemplates = await collection.countDocuments({});
    const visibleTemplates = await collection.countDocuments({
      business: businessId,
      channel: 'EMAIL',
      isRemoved: false,
    });

    const latestTemplates = await collection
      .find(
        {
          business: businessId,
          channel: 'EMAIL',
        },
        {
          projection: {
            name: 1,
            status: 1,
            templateType: 1,
            isArchived: 1,
            isRemoved: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    console.log(
      JSON.stringify(
        {
          database: db.databaseName,
          collection: COLLECTION_NAME,
          exists: true,
          totalTemplates,
          visibleTemplates,
          latestTemplates: latestTemplates.map((template) => ({
            _id: template._id.toString(),
            name: template.name,
            status: template.status,
            templateType: template.templateType,
            isArchived: template.isArchived,
            isRemoved: template.isRemoved,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          })),
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
