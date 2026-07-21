import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/track/play/:id',
    name: 'TrackPlay',
    component: () => import('@/views/track/play.vue'),
    meta: { title: '播放中' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'artist',
        name: 'Artist',
        component: () => import('@/views/artist/index.vue'),
        meta: { title: '艺人管理' }
      },
      {
        path: 'album',
        name: 'Album',
        component: () => import('@/views/album/index.vue'),
        meta: { title: '专辑管理' }
      },
      {
        path: 'track',
        name: 'Track',
        component: () => import('@/views/track/index.vue'),
        meta: { title: '曲目管理' }
      },
      {
        path: 'banner',
        name: 'Banner',
        component: () => import('@/views/banner/index.vue'),
        meta: { title: 'Banner 管理' }
      },
      {
        path: 'recommend',
        name: 'Recommend',
        component: () => import('@/views/recommend/index.vue'),
        meta: { title: '推荐池管理' }
      },
      {
        path: 'rank',
        name: 'Rank',
        component: () => import('@/views/rank/index.vue'),
        meta: { title: '排行榜管理' }
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/message/index.vue'),
        meta: { title: '消息管理' }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'admin-user',
        name: 'AdminUser',
        component: () => import('@/views/admin-user/index.vue'),
        meta: { title: '管理员账号' }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色权限' }
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/audit/index.vue'),
        meta: { title: '审计日志' }
      },
      {
        path: 'third-setting',
        name: 'ThirdSetting',
        component: () => import('@/views/system/thirdSetting/index.vue'),
        meta: { title: '第三方设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
