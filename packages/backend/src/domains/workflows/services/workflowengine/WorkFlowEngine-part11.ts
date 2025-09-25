transformations.forEach((transform: any) => {
  const { operation, field, value } = transform;

  switch (operation) {
    case 'set':
      output[field] = value;
      break;
    case 'append':
      output[field] = (output[field] || '') + value;
      break;
    case 'uppercase':
      output[field] = String(output[field] || '').toUpperCase();
      break;
    case 'lowercase':
      output[field] = String(output[field] || '').toLowerCase();
      break;
  }
});

return output;
}

  /**
   * Get Gmail credentials for user
   */
  private async getGmailCredentials(userId: string): Promise<any>
{
  const credential = await Credential.findOne({
    userId,
    integration: { $in: ['gmail', 'gmailOAuth2'] },
    isActive: true,
  }).select('+data');

  if (!credential) {
    throw new Error('No valid Gmail credentials found for user');
  }

  return credential.getDecryptedData();
}

/**
 * Process email list (comma-separated string to array)
 */
private
processEmailList(emailString: string)
: string[]
{
  if (!emailString) return [];
  return emailString
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
}
}
