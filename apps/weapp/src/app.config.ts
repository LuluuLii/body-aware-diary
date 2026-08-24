// T7 骨架：5 个 v2 页面，不用 Taro 内置 tabBar（handoff 是自定义悬浮圆角 + 中央 + 按钮）
export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/record/index',
    'pages/review/index',
    'pages/poses/index',
    'pages/pose-detail/index',
    'pages/pose-add/index',
    'pages/practice-detail/index',
    'pages/diary/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F4EFE3',
    navigationBarTitleText: '身体感知日记',
    navigationBarTextStyle: 'black',
  },
})
