// Verify no data loss in serialization
expect(deserialized).toEqual(essentialData);
expect(deserialized.nodes[1].credentials).toBe('openai-creds-1');
expect(deserialized.nodes[1].parameters.provider).toBe('openai');

// Verify compact size
expect(serialized.length).toBeLessThan(600); // Much smaller than legacy
})
})
})
