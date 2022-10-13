import zhHans from 'vuetify/es5/locale/zh-Hans.js'
export default {
  isDev:true,
  // page源码目录
  source_page:"src/pages",
  // layout源码目录
  source_layout: "src/layouts",
  // 自定义component源码目录
  source_component: "src/components",
  // 可根据配置文件目标文件目录生成静态服务器，此处设置为外链url引入前缀，
  // injectStyle:'/static', 
  // injectScript:'/static',
  injectStyle:true, 
  injectScript:true,
  buildModules:{
    '~/modules/vuetify.js':{
      // 自定义meta 引入相关 css 和 js资源
      // meta:{},
      option:{
        theme: { dark: true },
        lang: {
          locales: { zhHans:zhHans.default},
          current: 'zhHans',
        }
      }
    }
  },
  rollupExternal:["vuetify","vuetify/lib"],
  rollupGlobals:{"vuetify":"Vuetify"}
}