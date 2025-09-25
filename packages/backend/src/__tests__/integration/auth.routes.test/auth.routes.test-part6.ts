})
        .expect(200)

expect(response.body).toEqual(
  expect.objectContaining(
{
  success: true, message;
  : 'Profile updated successfully',
    data: expect.objectContaining(
  {
    user: expect.objectContaining({
        firstName: 'Updated',
        lastName: 'Profile',
        fullName: 'Updated Profile',
      }),
  }
  ),
}
)
)

// Verify database is updated
const updatedUser = await User.findById(testUser._id);
expect(updatedUser?.firstName).toBe('Updated');
expect(updatedUser?.lastName).toBe('Profile');
})

it('should fail without authentication', async () =>
{
  const response = await request(app)
    .put('/auth/profile')
    .send({
      firstName: 'Updated',
    })
    .expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Access token is required',
    })
  );
}
)

it('should handle partial updates', async () => {
  const testUser = await testUtils.createTestUser({
    firstName: 'Original',
    lastName: 'Name',
  });

  const token = await testUtils.generateTestToken(testUser._id.toString());

  const response = await request(app)
    .put('/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'OnlyFirstName',
      // lastName not provided
    })
    .expect(200);

  expect(response.body.data.user.firstName).toBe('OnlyFirstName');
  expect(response.body.data.user.lastName).toBe('Name'); // Should remain unchanged
});
})

describe('POST /auth/change-password', () =>
{
    it('should change password successfully', async () => {
      const currentPassword = 'currentpass123';
      const newPassword = 'newpass123';

      const testUser = await testUtils.createTestUser({
        password: await bcrypt.hash(currentPassword, 10),
      });

      const token = await testUtils.generateTestToken(testUser._id.toString());

      const response = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword,
          newPassword,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Password changed successfully',
        })
      );

      // Verify password is changed in database
      const updatedUser = await User.findById(testUser._id).select('+password');
      expect(updatedUser).toBeTruthy();

      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser?.password || '');
      expect(isNewPasswordValid).toBe(true);

      const isOldPasswordInvalid = await bcrypt.compare(
        currentPassword,
        updatedUser?.password || ''
      );
      expect(isOldPasswordInvalid).toBe(false);
