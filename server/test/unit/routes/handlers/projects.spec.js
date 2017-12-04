const proxy = require('proxyquire');
const { omit, extend } = require('lodash');

describe('projects handlers', () => {
  const sandbox = sinon.sandbox.create();
  describe('post', () => {
    beforeEach(() => {
      sandbox.reset();
    });
    it('should create a project and its associated users', async () => {
      // DATA
      const eventId = 'eventId';
      const name = 'MyLittleProject';
      const category = 'Flash';
      const dojoId = '';
      const member = {
        firstName: 'member',
        lastName: 'one',
        dob: '2010-09-01T00:00.000Z',
        country: 'FR',
        type: 'member',
      };
      const supervisor = {
        firstName: 'supervisor',
        lastName: 'one',
        dob: '2010-09-01T00:00.000Z',
        type: 'supervisor',
        email: 'a@aa.a',
        phone: '01234567',
      };

      // STUBs
      const mockUserSaveMember = sandbox.stub().resolves({ id: 'user1' });
      const mockUserSaveSupervisor = sandbox.stub().resolves({ id: 'user2' });
      const mockProjectSave = sandbox.stub().resolves({ id: 'project' });
      const mockAttachProject = sinon.stub().resolves({});
      const mockMembersProject = sandbox.stub().returns({
        attach: mockAttachProject,
      });
      // Multiple withArgs must be splitted : https://github.com/sinonjs/sinon/issues/176
      const mockUserModel = sandbox.stub();
      mockUserModel.withArgs(omit(member, ['type'])).returns({
        save: mockUserSaveMember,
      });
      mockUserModel.withArgs(extend(omit(supervisor, ['type']), { id: 'user2' })).returns({
        save: mockUserSaveSupervisor,
      });
      const mockProjectModel = sandbox.stub().returns({
        save: mockProjectSave,
        members: mockMembersProject,
      });
      const mockUserHandler = {
        get: sandbox.stub().resolves({ id: 'user2' }),
      };
      const handlers = proxy('../../../../routes/handlers/projects', {
        '../../models/user': mockUserModel,
        '../../models/project': mockProjectModel,
        './users': mockUserHandler,
      });
      const reqMock = {
        params: { eventId },
        body: {
          name,
          category,
          dojoId,
          users: [member, supervisor],
        },
      };
      const jsonReqMock = sandbox.stub().returns({ id: 'project' });
      const statusResMock = sandbox.stub().returns({ json: jsonReqMock });
      const resMock = { status: statusResMock };
      const nextMock = sandbox.stub();

      // ACT
      await handlers.post(reqMock, resMock, nextMock);

      // First, save the project
      expect(mockProjectModel).to.have.been.calledTwice;
      expect(mockProjectModel.getCall(0).args[0]).to.be.eql({
        eventId,
        name,
        category,
        dojoId,
      });
      expect(mockProjectSave).to.have.been.calledOnce;

      // Then retrieve existing user(s)
      expect(mockUserHandler.get).to.have.been.calledOnce;
      expect(mockUserHandler.get).to.have.been.calledWith({ email: supervisor.email });
      expect(mockUserModel).to.have.been.calledWith(extend(omit(supervisor, ['type']), { id: 'user2' }));

      // Then save the (potentially new) users
      expect(mockUserModel).to.have.been.calledWith(omit(member, ['type']));
      expect(mockUserSaveMember).to.have.been.calledOnce;
      expect(mockUserSaveSupervisor).to.have.been.calledOnce;
      expect(mockUserModel).to.have.been.calledTwice;

      // Then save the associations
      expect(mockProjectModel.getCall(1).args[0]).to.be.eql({ id: 'project' });
      expect(mockMembersProject).to.have.been.calledOnce;
      expect(mockAttachProject).to.have.been.calledOnce;
      expect(mockAttachProject).to.have.been.calledWith([{ user_id: 'user1', type: 'member' }, { user_id: 'user2', type: 'supervisor' }]);

      // Finally return the project/JSON
      expect(statusResMock).to.have.been.calledOnce;
      expect(statusResMock).to.have.been.calledWith(200);
      expect(jsonReqMock).to.have.been.calledOnce;
      expect(jsonReqMock).to.have.been.calledWith({ id: 'project' });
    });

    it('should call next on erroneous behavior', (done) => {
      // DATA
      const eventId = 'eventId';
      const name = 'MyLittleProject';
      const category = 'Flash';
      const dojoId = '';
      const err = new Error('Fake err');
      const expectedErr = new Error('Error while saving your project.');

      // STUBs
      const mockProjectSave = sandbox.stub().rejects(err);
      const mockUserModel = sandbox.stub().returns({});
      const mockProjectModel = sandbox.stub().returns({
        save: mockProjectSave,
      });
      const handlers = proxy('../../../../routes/handlers/projects', {
        '../../models/user': mockUserModel,
        '../../models/project': mockProjectModel,
      });
      const reqMock = {
        params: { eventId },
        body: {
          name,
          category,
          dojoId,
          users: [],
        },
      };
      const resMock = sandbox.stub();

      // ACT
      handlers.post(reqMock, resMock, (_err) => {
        // First, save the project
        expect(mockProjectModel).to.have.been.calledOnce;
        expect(mockProjectModel).to.have.been.calledWith({
          eventId,
          name,
          category,
          dojoId,
        });
        expect(mockProjectSave).to.have.been.calledOnce;

        // Finally return the err
        expect(_err.message).to.equal(expectedErr.message);
        done();
      });
    });
  });
});
