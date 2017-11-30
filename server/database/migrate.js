const logger = require('../util/logger');
const path = require('path');

module.exports = bookshelf =>
  new Promise((resolve, reject) => {
    // Default "migrate" will take js files in the ./migrations folder
    bookshelf.knex.migrate
      .latest({ directory: path.join(__dirname, '/migrations') })
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          return bookshelf.knex.seed.run({ directory: './database/seeds' });
        }
        return Promise.resolve();
      })
      .then(() => {
        logger.info('Migrations finished properly');
        resolve();
      })
      .catch(reject);
  });
