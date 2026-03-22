import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

export const BUSINESS_CONFIGURATIONS_MODEL_NAME = 'BusinessConfiguration';
export const BUSINESS_CONFIGURATIONS_COLLECTION_NAME = 'businessConfigurations';

export const businessConfigurationSchema = new Schema(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: 'businesses',
      index: true,
      required: true,
    },
    indexedCustomFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
    strict: false,
  },
);

export type BusinessConfigurationDocument = InferSchemaType<typeof businessConfigurationSchema>;

export function getBusinessConfigurationModel(
  connection: typeof mongoose = mongoose,
): Model<BusinessConfigurationDocument> {
  return (
    (connection.models[BUSINESS_CONFIGURATIONS_MODEL_NAME] as
      | Model<BusinessConfigurationDocument>
      | undefined) ||
    connection.model<BusinessConfigurationDocument>(
      BUSINESS_CONFIGURATIONS_MODEL_NAME,
      businessConfigurationSchema,
      BUSINESS_CONFIGURATIONS_COLLECTION_NAME,
    )
  );
}

