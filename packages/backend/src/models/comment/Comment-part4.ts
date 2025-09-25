timestamp: new Date(),
})

return this.save();
}

commentSchema.methods.removeReaction =
function (userId: string) {
  this.reactions = this.reactions.filter((r: any) => r.userId !== userId);
  return this.save();
}

commentSchema.methods.resolve = function (resolvedBy: string) {
  this.status = 'resolved';
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

commentSchema.methods.edit = function (newContent: string, editedBy: string) {
  // Store edit history
  this.editHistory.push({
    timestamp: new Date(),
    previousContent: this.content,
    editedBy,
  });

  this.content = newContent;
  return this.save();
};

// Pre-save middleware to validate mentions
commentSchema.pre('save', function (next) {
  // Validate that mention indices are within content bounds
  for (const mention of this.mentions) {
    if (mention.startIndex < 0 || mention.endIndex > this.content.length) {
      next(new Error('Invalid mention indices'));
      return;
    }
  }
  next();
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
