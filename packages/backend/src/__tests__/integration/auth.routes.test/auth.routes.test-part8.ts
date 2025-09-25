// 4. Refresh token
const refreshResponse = await request(app).post('/auth/refresh').send({ refreshToken }).expect(200);

const { accessToken: newToken } = refreshResponse.body.data;

// 5. Use new token to access profile
const newProfileResponse = await request(app)
  .get('/auth/profile')
  .set('Authorization', `Bearer ${newToken}`)
  .expect(200);

expect(newProfileResponse.body.data.user.firstName).toBe('Updated Flow');

// 6. Login with updated user
const loginResponse = await request(app)
  .post('/auth/login')
  .send({
    email: 'flow@test.com',
    password: 'Password123',
  })
  .expect(200);

expect(loginResponse.body.data.user.firstName).toBe('Updated Flow');

// 7. Logout
await request(app).post('/auth/logout').expect(200);
})
})
})
