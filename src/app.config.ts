export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/record/index',
    'pages/body-map/index',
    'pages/search/index',
    'pages/knowledge/index',
    'pages/knowledge-detail/index',
    'pages/import-material/index',
    'pages/profile/index',
    'pages/entry-detail/index',
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#4F46E5',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '日记',
      },
      {
        pagePath: 'pages/search/index',
        text: '搜索',
      },
      {
        pagePath: 'pages/knowledge/index',
        text: '知识',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '身体感知日记',
    navigationBarTextStyle: 'black',
  },
})
