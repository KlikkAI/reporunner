mockReq.user = { id: testUser._id.toString() };
mockReq.body = {
  currentPassword: 'currentpassword',
  newPassword: 'newpassword123',
};

await authController.changePassword(mockReq as Request, mockRes as Response);

expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    success: true,
    message: 'Password changed successfully',
  })
);
})

it('should fail when not authenticated', async () =>
{
  mockReq.user = undefined;
  mockReq.body = {
    currentPassword: 'current',
    newPassword: 'new',
  };

  await expect(
    authController.changePassword(mockReq as Request, mockRes as Response)
  ).rejects.toThrow('Not authenticated');
}
)

it('should fail with incorrect current password', async () =>
{
  const testUser = await testUtils.createTestUser({
    password: await bcrypt.hash('correctpassword', 10),
  });

  mockReq.user = { id: testUser._id.toString() };
  mockReq.body = {
    currentPassword: 'wrongpassword',
    newPassword: 'newpassword123',
  };

  await expect(
    authController.changePassword(mockReq as Request, mockRes as Response)
  ).rejects.toThrow('Current password is incorrect');
}
)
})
})
