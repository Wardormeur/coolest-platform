const bookshelf = require('../database');
const logger = require('../util/logger');

const Project = bookshelf.Model.extend({
  tableName: 'project',
  event() {
    return this.belongsTo('Event');
  },
  // Relations
  members() {
    return this.belongsToMany('User').through('ProjectUsers');
  },
  owner() {
    return this.belongsToMany('User').through('ProjectUsers').query(q => q.where('type', 'owner'));
  },
  supervisor() {
    return this.belongsToMany('User').through('ProjectUsers').query(q => q.where('type', 'supervisor'));
  },
  adminView() {
    // NOTE: if this monstruosity doesn't work, fallback to 
    // a view + custom Model (knex join) + serializer (field into object => https://www.npmjs.com/package/treeize)
    const db = bookshelf.knex;
    return this.query((qb) => {
      qb.columns('project.*')
        .innerJoin('project_users as opu', function () {
          this.on('opu.project_id', 'project.id')
            .andOn('opu.type', '=', db.raw('\'owner\''));
        })
        .innerJoin('user as owner', 'opu.user_id', 'owner.id')
        .innerJoin('project_users as spu', function () {
          this.on('spu.project_id', 'project.id')
            .andOn('spu.type', '=', db.raw('\'supervisor\''));
        })
        .innerJoin('user as supervisor', 'spu.user_id', 'supervisor.id');
    });
  },
  // Helper
  isOwner(userId) {
    let isOwner = false;
    if (this.relations.owner && this.relations.owner.length > 0) {
      isOwner = this.relations.owner.at(0).attributes.id === userId;
    } else {
      logger.error('Unexpected usage of isOwner');
    }
    return isOwner;
  },
  // Formatter
  toJSON() {
    if (this.relations) {
      // Overwrite query responses to singular object instead of a collection
      // as qBuilder doesnt allow a singular request when using a n-m relationship
      if (this.relations.owner && this.relations.owner.length > 0) {
        this.relations.owner = this.relations.owner.at(0);
      }
      if (this.relations.supervisor && this.relations.supervisor.length > 0) {
        this.relations.supervisor = this.relations.supervisor.at(0);
      }
    }
    return bookshelf.Model.prototype.toJSON.apply(this);
  },
  uuid: true,
  hasTimestamps: true,
});

module.exports = bookshelf.model('Project', Project);
