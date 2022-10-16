vue2 sfc 文件的编译工具。 基于rollup。

参考nuxt的模式， vue文件分为 `page`,`layout`,`component` 三种类型， `component`自定义的组件可以直接在`page`和`layout`中使用，而无需引入。 `page`中设定layout， 编译工具会自动寻找`layout`并组合成最终页面的服务端渲染js和客户端js

### 安装

  ```
  npm i vuesfc -s

  ```

### 配置

#### `vuesfc.config.js`
项目根目录下可以创建`vuesfc.config.js`文件来自定义配置，默认配置请查看库根目录下的`vuesfc.config.js`文件。 默认如下：

```
export default {
  // ============================================================ render相关,不建议修改
  // 应用名称
  appName:"App",
  // page组件的组件名
  pageComponentName:"customPage",
  // window下当前layout和page组件名称对应的变量名
  layoutNameKey:"__layoutName",
  pageNameKey:"__pageName",
  // 前端state数据的windowskey
  stateWindowKey:'__INITIAL_STATE__',
  // meta数据windowskey
  metaWindowKey:'__INITIAL_META__',
  // 组件js&css文件注入页面的url前缀,eg:'/static'. 页面上资源实际地址为：${injectPath}/page[layout]-hash-bundle.[js|css]
  // 如果设置为false，代码将直接注入页面
  injectUrl:false, 
  // 注入页面的vuejs地址
  vueUrl:'https://cdn.jsdelivr.net/npm/vue@2.7.10',
  // ============================================================= complier 编译相关
  // sfc源文件后缀
  source_ext:'.vue',
  // page源码目录
  source_page:"pages",
  // layout源码目录
  source_layout: "layouts",
  // 自定义component源码目录,可以是数组传入多个
  source_component: "components",
  // vue-meta设置
  vuemeta:{
    keyName:'head',
    tagIDKeyName:'vmid',
    ssrAppId:'app',
    ssrAttribute:'data-vmssr',
    attribute:'data-vm'
  },
  // 需要参与编译渲染的第三方的module配置
  buildModules:{
  },
  //rollup 相关 ，可扩展以下两个属性，配合自定义modules
  rollupExternal:[],
  rollupGlobals:{}
}
```

#### app页面模板文件

项目根目录下可以创建`app.template.html`文件来自定义页面模板，默认为：

```
<!DOCTYPE html>
<html ${HTML_ATTRS}>
  <head ${HEAD_ATTRS}>
    ${HEAD}
  </head>
  <body ${BODY_ATTRS}>
    ${APP}
  </body>
</html>

```

### SSR API

#### ::compiler 编译项目

 编译所有page，自动整合相关组件，生成客户端和服务端代码，以供渲染使用。`page`,`layout`,`component` 生成的服务器端渲染js中会自动包含css的注入， 客户端js中不包含css. 第三方模块可以自定义meta信息注入。 
  
  ```
  import {compiler} from "vuesfc"
  /**
  *编译vue项目，开发模式下会实时监控变动
  * @export
  * @param {function} onBuildComplier 编译完成之后的回调
  * @param {boolean} [isDev=false] 是否开发模式
  */
  compiler(onFinished,true)
  ```

 编译最终文件的输出根目录`rootDist`可以用做静态服务提供，及项目编译后的资源manifest文件`versPath`

 ```
  import {rootDist,versPath} from "vuesfc"

 ```

 另外提供了`setVueComponentDirs`方法可以动态的预设vue组件的自动导入目录，注意只有在`compiler`调用之前有效

  import {setVueComponentDirs} from "vuesfc"


#### ::renderer 渲染页面

  ```
  import  {renderer} from "vuesfc";

  /**
  * 渲染页面,须在编译完成后执行
  * @param {string} pagePath  页面源地址. 可以是相对于页面源码目录的相对地址,也可使绝对地址
  * @param {...any} params  附加参数,会同步注入到页面源码中的asyncData方法中作为参数
  * @returns  html|false
  */
  const html = await renderer("home.vue",{title:'test'},...)
  ```

#### ::getRenderInfo 获取页面信息

只返回页面对应的数据及页面对应的客户端js&css数据，可从配合前端通过`App.setAsyncPage`动态渲染页面

```
  import  {getRenderInfo} from "vuesfc";

  /**
  * 可单独用于前端动态获取页面对应的page组件相关style,script信息和asyncData处理数据（如果有的话）。
  * 注意title 和 meta信息不会处理，不获取服务端渲染代码，所以使用时不建议page组件中设置meta
  * @param {string} pagePath  页面源地址. 可以是相对于页面源码目录的相对地址,也可使绝对地址
  * @param {...any} params  附加参数,会同步注入到页面源码中的asyncData方法中作为参数
  * @returns  object|false
  */
  const json = await renderer("home.vue",{title:'test'},...)

```

### Client API
前端暴露了一些可操作的API，用于用户定制化

#### ::App.getInstance()

获取渲染实例，vue实例

#### ::App.onReady(func)

App初次渲染完成回调方法
#### ::App.setAsyncPage(pageInfo)

根据服务端API`getRenderInfo`返回的页面相关数据，，可用于前端动态渲染页面

#### ::App.setPage(pageId)

根据pageid，设置当前page。前提是page资源已经加载过，可用于前端动态切换
#### ::App.setLayout(layoutId)

根据layoutid，设置当前layout。前提是layout资源已经加载过，可用于前端动态切换

#### ::App.setAsyncPage(pageInfo)

根据服务端API`getRenderInfo`返回的页面相关数据，动态渲染页面

### meta管理

内置集成`vue-meta`库进行meta管理，只在服务器端生效。可在`layout`和`page` 单页面组件中设定meta值，默认key为`head`,也可在配置文件中修改`vuemeta`选项配置. 

### 自定义编译模块

用户可以自行实现自己的内置编译模块，支持模板化，支持客户端和服务端代码分离。请妥善使用模板，避免将敏感配置吸入文件，输出到前端。 在配置文件中`buildModules`配置项中设置要加载的自定义编译模块。路径引入方式略有不同,需要`~`开头代表项目根目录：

  ```
  buildModules:{
    '~/moudles/modulename.js':{...options} 
  }

  ```
 
为了更好的帮助自定义木块控制编译，配置文件提供了 `rollupExternal`和 `rollupGlobals` 选项来控制rollup的对应配置。

  ```
  rollupExternal:[],
  rollupGlobals:{}
  ```

### demo

  源码下面的[example](./example/).目录下有相关demo。
