})

// Methods
collaborationSessionSchema.methods.addParticipant =
function (participant: any) {
  const existingIndex = this.participants.findIndex((p: any) => p.userId === participant.userId);

  if (existingIndex >= 0) {
    // Update existing participant
    this.participants[existingIndex] = {
      ...this.participants[existingIndex],
      ...participant,
      lastSeen: new Date(),
    };
  } else {
    // Add new participant
    this.participants.push({
      ...participant,
      joinedAt: new Date(),
      lastSeen: new Date(),
    });
  }

  this.lastActivity = new Date();
  return this.save();
}

collaborationSessionSchema.methods.removeParticipant = function (userId: string) {
  this.participants = this.participants.filter((p: any) => p.userId !== userId);
  this.lastActivity = new Date();
  return this.save();
};

collaborationSessionSchema.methods.updateParticipantPresence = function (
  userId: string,
  presence: any
) {
  const participant = this.participants.find((p: any) => p.userId === userId);
  if (participant) {
    if (presence.cursor) participant.cursor = presence.cursor;
    if (presence.selection) participant.selection = presence.selection;
    participant.lastSeen = new Date();
    this.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

collaborationSessionSchema.methods.incrementVersion = function () {
  this.currentVersion += 1;
  this.metadata.totalOperations += 1;
  this.lastActivity = new Date();
  return this.save();
};

export const CollaborationSession = mongoose.model<ICollaborationSession>(
  'CollaborationSession',
  collaborationSessionSchema
);
