// server.js
const jsonServer = require('json-server');

const server = jsonServer.create();
const router = jsonServer.router(require('./db'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(require('body-parser').json());

server.use(jsonServer.rewriter({
  '/api/v1/events/:eventId/projects/:projectId': '/api/v1/projects/:projectId'
}));

server.post('/api/v1/auth', (req, res) => {
  if (req.body.email === 'existinguser@example.com') {
    res.status(204).send();
  } else {
    res.status(403).send();
  }
});

server.use('/api/v1/users', (req, res, next) => {
  req.body.auth = {
    token: '1234asdf'
  };
  next();
});

server.use('/api/v1', router);

server.listen(3000, () => {
  console.log('JSON Server is running')
});
