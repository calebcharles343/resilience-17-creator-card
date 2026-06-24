/**
 * Mongoose plugin to add timestamps to schemas
 * Adds: created, updated, deleted fields
 */
module.exports = function timestampsPlugin(schema) {
  // Add timestamp fields
  schema.add({
    created: { type: Number, default: () => Date.now() },
    updated: { type: Number, default: () => Date.now() },
    deleted: { type: Number, default: null },
  });

  // Update the 'updated' timestamp on save
  schema.pre('save', function (next) {
    this.updated = Date.now();
    next();
  });

  // Update the 'updated' timestamp on update
  schema.pre('findOneAndUpdate', function (next) {
    this.set({ updated: Date.now() });
    next();
  });
};
