import Vue from 'vue';
import Router from 'vue-router';
import scrollBehavior from '@/router/scrollBehaviour';
import adminNavGuard from '@/router/adminNavGuard';
import userAuthNavGuard from '@/router/userAuthNavGuard';
import Index from '@/Index';
import PageNotFound from '@/PageNotFound';
import Auth from '@/event/Auth';
import ProjectList from '@/project/List';
import ViewProject from '@/project/View';
import CreateProject from '@/project/Create';
import ProjectExtraDetails from '@/project/ExtraDetails';
import CreateProjectCompleted from '@/project/CreateCompleted';
import EditProject from '@/project/Edit';

// ADMIN
const Admin = () => import(/* webpackChunkName: "admin" */ '@/admin/Base');
const AdminLogin = () => import(/* webpackChunkName: "admin" */ '@/admin/auth/Login');
const AdminProjectsList = () => import(/* webpackChunkName: "admin" */ '@/admin/projects/List');
const AdminProjectsView = () => import(/* webpackChunkName: "admin" */ '@/admin/projects/View');
const AdminProjectsStats = () => import(/* webpackChunkName: "admin" */ '@/admin/projects/Stats');

Vue.use(Router);

export default new Router({
  mode: 'history',
  scrollBehavior,
  routes: [
    {
      path: '/',
      redirect: '/events/cp-2018',
      component: Index,
      name: 'Index',
      children: [
        {
          path: 'events/:eventSlug',
          component: {
            template: '<router-view></router-view>',
          },
          props: true,
          children: [
            {
              path: '',
              name: 'Auth',
              component: Auth,
              props: true,
            },
            {
              path: 'my-projects',
              name: 'ProjectList',
              component: ProjectList,
              props: true,
              beforeEnter: userAuthNavGuard,
            },
            {
              path: 'projects',
              component: {
                template: '<router-view></router-view>',
              },
              props: true,
              beforeEnter: userAuthNavGuard,
              children: [
                {
                  path: 'create',
                  name: 'CreateProject',
                  component: CreateProject,
                  props: true,
                },
                {
                  path: ':projectId/extra',
                  name: 'ProjectExtraDetails',
                  component: ProjectExtraDetails,
                  props: true,
                },
                {
                  path: ':projectId/complete',
                  name: 'CreateProjectCompleted',
                  component: CreateProjectCompleted,
                  props: true,
                },
                {
                  path: ':projectId',
                  name: 'ViewProject',
                  component: ViewProject,
                  props: true,
                },
                {
                  path: ':projectId/edit',
                  name: 'EditProject',
                  component: EditProject,
                  props: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: '/admin',
      component: Admin,
      children: [
        {
          path: '',
          name: 'Admin',
          redirect: 'events/cp-2018',
          beforeEnter: adminNavGuard,
        },
        {
          path: 'login',
          name: 'AdminLogin',
          component: AdminLogin,
        },
        {
          path: 'events/:eventSlug',
          component: {
            template: '<router-view></router-view>',
          },
          props: true,
          beforeEnter: adminNavGuard,
          children: [
            {
              path: '',
              name: 'AdminProjects',
              component: AdminProjectsList,
              props: true,
            },
            {
              path: 'projects/:projectId',
              name: 'AdminProjectsView',
              component: AdminProjectsView,
              props: true,
            },
            {
              path: 'stats',
              name: 'AdminProjectsStats',
              component: AdminProjectsStats,
              props: true,
            },
          ],
        },
      ],
    },
    { path: '*', component: PageNotFound },
  ],
});
