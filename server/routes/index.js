const express = require('express');
const usersApi = require('./api/users');
const projectsApi = require('./api/projects');
const authApi = require('./api/auth');
const eventsApi = require('./api/events');
const pingApi = require('./api/ping');

const router = express.Router();
const apiPrefix = '/api/v1';

usersApi(router, apiPrefix);
authApi(router, apiPrefix);
projectsApi(router, apiPrefix);
eventsApi(router, apiPrefix);
pingApi(router, apiPrefix);

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /');
});

router.get(`${apiPrefix}/coffee`, (req, res) => {
  res.statusMessage = "I'm a teapot";
  res
    .status(418)
    .json({ message: "I'm a teapot", image: 'https://httpstatusdogs.com/img/418.jpg' });
});

module.exports = router;
