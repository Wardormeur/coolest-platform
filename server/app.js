const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const protect = require('@risingstack/protect');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const logger = require('./util/logger');

const Auth = require('./models/auth');
const migrate = require('./database/migrate');
const routes = require('./routes/index');

const app = express();
// uncomment after placing your favicon in /public
migrate().then(() => {
  // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(morgan('combined', { stream: logger.stream }));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', routes);
  app.get('/coffee', (req, res) => {
    res.statusMessage = "I'm a teapot";
    res
      .status(418)
      .json({ message: "I'm a teapot", image: 'https://httpstatusdogs.com/img/418.jpg' });
  });

  app.use(
    protect.express.sqlInjection({
      body: true,
      loggerFunction: logger.error,
    }),
  );

  app.use(
    protect.express.xss({
      body: true,
      loggerFunction: logger.error,
    }),
  );
  // catch 404 and forward to error handler
  app.use((req, res) => {
    const err = new Error('Not Found');
    err.status = 404;
    res.status(err.status);
    res.send({ status: err.status });
  });

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          ExtractJwt.fromUrlQueryParameter('token'),
        ]),
        secretOrKey: 'secret',
        maxAge: '8h',
      },
      ({ sub }, done) => {
        Auth.where({ userId: sub })
          .fetchOne()
          .then((auth) => {
            done(null, auth);
          });
      },
    ),
  );

  // error handler
  app.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send({ status: err.status, msg: err.message });
  });
});

module.exports = app;
