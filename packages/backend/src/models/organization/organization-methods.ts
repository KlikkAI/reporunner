// Indexes for performance
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ isActive: 1 });
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ 'billing.status': 1 });
organizationSchema.index({ plan: 1 });

// Virtual for user count (would need to be populated separately)
organizationSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizationId',
  count: true,
});

// Method to check if organization has a specific feature
organizationSchema.methods.hasFeature = function (feature: string): boolean {
  return this.settings.features.includes(feature);
};

// Method to check if organization can add more users
organizationSchema.methods.canAddUsers = function (currentUserCount: number): boolean {
  if (!this.settings.maxUsers) return true;
  return currentUserCount < this.settings.maxUsers;
};

// Method to check if organization can add more workflows
organizationSchema.methods.canAddWorkflows = function (currentWorkflowCount: number): boolean {
  if (!this.settings.maxWorkflows) return true;
  return currentWorkflowCount < this.settings.maxWorkflows;
};

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
