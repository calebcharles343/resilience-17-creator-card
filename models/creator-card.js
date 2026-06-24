const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');
const timestamps = require('./plugins/timestamps');

const modelName = 'creatorcards';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String, index: true },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, index: true },
  links: { type: SchemaTypes.Array, default: [] },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, index: true },
  access_type: { type: SchemaTypes.String, default: 'public' },
  access_code: { type: SchemaTypes.String },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });
modelSchema.plugin(timestamps);

/** @type {ModelSchema} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
