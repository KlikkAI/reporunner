// 5. Login with registered user
const loginResponse = await request(app)
  .post('/auth/login')
  .send({
    email: 'flow@test.com',
    password: 'FlowTest123',
  })
  .expect(200);

expect(loginResponse.body.data.user.email).toBe('flow@test.com');
})
})
})
