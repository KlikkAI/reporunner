// Verify session was ended in database
const updatedSession = await CollaborationSession.findOne({
  sessionId: session.sessionId,
});
expect(updatedSession?.isActive).toBe(false);
})
})
})
})
