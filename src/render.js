// 编译后的文件 渲染
import {join,extname} from "path"
import {createRenderer} from "vue-server-renderer"
import { readFile} from "fs/promises"
import deepmerge from "deepmerge"
import VueMeta from 'vue-meta'
import template from "lodash.template"
import { logger,getRuntimeConfig,getManifest,distRootDir,getAbsolutePath} from "./utils.js"
import Vue from "vue"
let Config = null
let manifestInfo = null
/**
 * SSR渲染整个页面,须在编译完成后执行
 * @param {string} pagePath  页面源地址. 可以是相对于页面源码目录的相对地址,也可使绝对地址
 * @param {...any} params  附加参数,会同步注入到页面源码中的asyncData方法中作为参数
 * @returns  html|false
 */
export async function renderer(pagePath,...params){
  const appData = await getRenderData(pagePath,...params)
  if(!appData){return}
  const tpl = await getAppTemplate()
  const compiled = template(tpl)
  return compiled(appData)
}

// 获取页面对应的相关渲染数据，包括meta及相关资源文件及ssr渲染后的html
async function getRenderData(pagePath,...params){
  await init()
  //1 根据manifest分别获取 应用，page，layout信息
  if(!manifestInfo){return false}

  const appInfo = await getAppInfo()
  if(!appInfo){
    return false
  }
  const pageInfo = await getPageInfo(pagePath)
  if(!pageInfo){
    return false
  }
  const layoutInfo = await getLayoutInfo(pageInfo.layout)
  if(!layoutInfo){
    return false
  }

  // 2 初始化异步数据
  const dataLayout = await asyncData(layoutInfo.module,...params)
  const dataPage = await asyncData(pageInfo.module,...params)
  const dataMeta = {script:[{
      vmid:'json',
      innerHTML: `window.${Config.stateWindowKey} = {layout:${JSON.stringify(dataLayout)},page:${JSON.stringify(dataPage)}}`,
      type: 'text/javascript',
    }],__dangerouslyDisableSanitizersByTagID:{
      json: ['innerHTML']
    }}

  // 3 生成服务器端渲染实例
  const {createApp,setLayout,setPage} = appInfo.module
  setLayout(layoutInfo.id,layoutInfo.module,dataLayout)
  setPage(pageInfo.id,pageInfo.module,dataPage)
  const app = createApp()
  // 4 渲染生成html
  const html = await renderComponent(app)
  if(!html){
    return false
  }

  // 5 注入页面相关css&js
  let metas = {script:[{src:Config.vueUrl}]}
  const appMeta = await getAppInjectMeta(appInfo)
  const layoutMeta = await getComponentInjectMeta(layoutInfo,true)
  if(!layoutMeta){return}
  const pageMeta = await getComponentInjectMeta(pageInfo)
  if(!pageMeta){return}

  const {metas:moduleMeta} = await import(Config.moduleLoaderSSRPath)
  for (const mkey in moduleMeta) {
    metas = deepmerge(metas,moduleMeta[mkey])
  }
  // app要在module加载完之后
  metas = deepmerge(metas,appMeta)
  metas = deepmerge(metas,dataMeta)
  metas = deepmerge(metas,layoutMeta)
  metas = deepmerge(metas,pageMeta)
  const {set}  = app.$meta().addApp(Config.vuemeta.ssrAppId)
  set(metas)
  const metaInfo = app.$meta().inject()
  const appData = {
    HTML_ATTRS:metaInfo.htmlAttrs.text(Config.isDev),
    HEAD_ATTRS:metaInfo.headAttrs.text(),
    BODY_ATTRS:metaInfo.bodyAttrs.text(),
    HEAD:metaInfo.head(Config.isDev),
    APP:`<div id="__app">${html}</div>`
  }
  return appData
}

/**
 * 可单独用于前端动态获取页面对应的page组件相关style,script信息和asyncData处理数据（如果有的话）。
 * 注意title 和 meta信息不会处理，不获取服务端渲染代码，所以使用时不建议page组件中设置meta
 * @param {string} pagePath  页面源地址. 可以是相对于页面源码目录的相对地址,也可使绝对地址
 * @param {...any} params  附加参数,会同步注入到页面源码中的asyncData方法中作为参数
 * @returns  object|false
 */
export async function getRenderInfo(pagePath,...params){
  const result = {id:null,state:{},style:null,script:null}
  await init()
  //1 根据manifest分别获取 应用，page，layout信息
  if(!manifestInfo){return false}
  const pageInfo = await getPageInfo(pagePath,true)
  if(!pageInfo){
    return false
  }
  result.id = pageInfo.id
  // style
  if(pageInfo.cssPath){
    result.style = await readFile(pageInfo.cssPath).then(code=>code.toString("utf-8"))
  }else if(pageInfo.cssUrl){
    result.style = pageInfo.cssUrl
  }
  // js 
  if(pageInfo.jsPath){
    result.script= await readFile(pageInfo.jsPath).then(code=>code.toString("utf-8"))
  }else if(pageInfo.jsUrl){
    result.script = pageInfo.jsUrl
  }
  
  // 2 初始化异步数据
  const dataPage = await asyncData(pageInfo.module,...params)
  result.state.page = dataPage
  return result
}

// 操作前，初始化基础信息
async function init(){
  if(!Config){
    Config = await getRuntimeConfig()
    Vue.use(VueMeta,Config.vuemeta)
  }
  if(Config.isDev || !manifestInfo){
    manifestInfo = await getManifest()
  }
}

// 整理layout或者page路径在manifest中的名称
function resolveFilePath(path){
  if(extname(path)==''){
    path = path + Config.source_ext
  }
  return path
}
/**
 * 获取app应用信息
 * @returns 
 */
async function getAppInfo(){
  if(!manifestInfo || !manifestInfo.app){return null}
  const  jsPath = Config.injectScript===true? join(distRootDir,manifestInfo.app.client):null
  const  jsUrl = (typeof Config.injectScript == 'string')? join(Config.injectScript,manifestInfo.app.client):null
  const module = await import(join(distRootDir,manifestInfo.app.ssr)).catch(e=>{
    logger.error(`app complier file load error: `,e)
    return null
  })
  if(!module){
    return null
  }
 return {module,jsPath,jsUrl}
}
/**
 * 获取当前页的manifest信息,包含page的client相关资料信息 
 * @param {*} autoLoad  默认加载vm, 设置为true时，会根据是否有asyncData自动判断是否加载VM,
 */
async function getPageInfo(pagePath,autoLoad){
  pagePath = resolveFilePath(pagePath)
  const pageInfo = manifestInfo.page[pagePath] || null
  if(!pageInfo){return null}
  // 获取page对应的vm组件 ssr
  let vmPage=null
  if(!autoLoad || pageInfo.asyncData){
    vmPage = await import(join(manifestInfo.root,pageInfo.serverJs)).then(m=>m.default).catch(e=>{
      logger.error(`page:[${pagePath}] complier file load error: `,e)
      return null
    })
    if(!vmPage){return null}
  }

  const  jsPath = Config.injectScript===true? join(distRootDir,pageInfo.clientJs):null
  const  jsUrl = (typeof Config.injectScript == 'string')? join(Config.injectScript,pageInfo.clientJs)+'?'+pageInfo.jsVer:null
  const  cssPath = Config.injectStyle===true? join(distRootDir,pageInfo.clientCss):null
  const  cssUrl = (typeof Config.injectStyle == 'string')? join(Config.injectStyle,pageInfo.clientCss)+'?'+pageInfo.cssVer:null
  return {
    module:vmPage,
    id:pageInfo.id,
    type:'page',
    layout:pageInfo.layout||'default',
    jsPath,
    jsUrl,
    cssPath,
    cssUrl,
    // js:pageInfo.clientJs,
    // jsVer:pageInfo.jsVer,
    // css:pageInfo.clientCss,
    // cssVer:pageInfo.cssVer,
  }
}
/**
 * 获取当前页的manifest信息,包含page的client相关资料信息
 * @param {*} autoLoad  默认加载vm, 设置为true时，会根据是否有asyncData自动判断是否加载VM,
 */
async function getLayoutInfo(layoutName,autoLoad){
  layoutName = resolveFilePath(layoutName)
  const layoutInfo = manifestInfo.layout[layoutName]||null
  if(!layoutInfo){ return null}
  let module = null
  if(!autoLoad || layoutInfo.asyncData){
    module = await import(join(manifestInfo.root,layoutInfo.serverJs)).then(m=>m.default).catch(e=>{
      logger.error(`layout:[${layoutName}] complier file load error: `,e)
      return null
    })
    if(!module){
      return null
    }
  }
  const  jsPath = Config.injectScript===true? join(distRootDir,layoutInfo.clientJs):null
  const  jsUrl = (typeof Config.injectScript == 'string')? join(Config.injectScript,layoutInfo.clientJs)+'?'+layoutInfo.jsVer:null
  const  cssPath = Config.injectStyle===true? join(distRootDir,layoutInfo.clientCss):null
  const  cssUrl = (typeof Config.injectStyle == 'string')? join(Config.injectStyle,layoutInfo.clientCss)+'?'+layoutInfo.cssVer:null
  return {
    module,
    type:'layout',
    id:layoutInfo.id,
    jsPath,
    jsUrl,
    cssPath,
    cssUrl,
  //   js:layoutInfo.clientJs,
  //   jsVer:layoutInfo.jsVer,
  //   css:layoutInfo.clientCss,
  //   cssVer:layoutInfo.cssVer,
  }
}
// 根据页面信息获取对应的页面及布局的css&js 及state数据 js 组成的metaInfo信息
async function getComponentInjectMeta(componentInfo,isLayout){
  // 设定layout和page对象
  const nameKey = isLayout?Config.layoutNameKey:Config.pageNameKey
  const assetsMeta = {script:[{
                      innerHTML: `window.${nameKey}= '${componentInfo.id}'`,
                      type: 'text/javascript',
                    }],link:[],style:[]}
  try{
    // style
    if(componentInfo.cssPath){
      const cssStyle = await readFile(componentInfo.cssPath).then(code=>code.toString("utf-8"))
      assetsMeta.style.push({ cssText: cssStyle, type: 'text/css' })
    }else if(componentInfo.cssUrl){
      assetsMeta.link.push({ rel: 'stylesheet', href:componentInfo.cssUrl })
    }
    // js 
    if(componentInfo.jsPath){
      const jsCode = await readFile(componentInfo.jsPath).then(code=>code.toString("utf-8"))
      assetsMeta.script.push({innerHTML: jsCode,type: 'text/javascript',body: false})
    }else if(componentInfo.jsUrl){
      assetsMeta.script.push({src:componentInfo.jsUrl,body: false})
    }
    return assetsMeta
  }catch(e){
    logger.error(e)
    return false
  }
}
// 获取页面初始化数据及app入口基础js
async function getAppInjectMeta(appInfo){
  try{
    const metas = {
      script:[],
    }
    // js 
    if(appInfo.jsPath){
      const jsCode = await readFile(appInfo.jsPath).then(code=>code.toString("utf-8"))
      metas.script.push({innerHTML: jsCode,type: 'text/javascript',body: false})
    }else if(appInfo.jsUrl){
      metas.script.push({src:appInfo.jsUrl,body: false})
    }
    return metas
  }catch(e){
    logger.error(e)
    return false
  }
}
// asyncData，获取异步数据
async function asyncData(component,...params){
  let data = null
  if(component && component.asyncData){
    // let result = null
    // if(component.asyncData.constructor.name == 'AsyncFunction'){
    //   result = await component.asyncData(...params)
    // }else{
    //   result = component.asyncData(...params)
    // }
    const result = component.asyncData(...params)
    if(result instanceof Promise){
      data = await result.catch(e=>{
        logger.error(`[${component.name}] asyncData() get error:${e.message}`)
        return null
      })
    }else{
      data = result
    }
  }
  return data
}

// 渲染组件或者vue实例为html代码
async function renderComponent(vm){
  // ssr引导很多功能都是基于webpack，或者webpack打包生成的配置文件。
  // <!-- built files will be auto injected --> 基本基于vue-loader生成的clientMenifest文件，这里不可自动注入。
  // <!--vue-ssr-outlet-->可用自动注入，注入只有tmplate以及style和state可以渲染。
  const vueServerRender = createRenderer({
    inject:false,
    // cache:false,
    // template:`<!--vue-ssr-outlet-->`
  }) 
  // 这个上下文用于接收renderToString各种手动注入方法，同时可以用作数据注入，而这里是通过asyncData&mixins自定义实现的，所以不需要注入数据了了
  const context = {rendered(){ logger.debug('server renderd ok')}}
  /**
   * vueServerRender.renderToString(app,context,function(err,html){
   * 在 renderToString 回调函数中，你传入的 context 对象(第二个对象)会暴露以下方法： renderStyles，renderState等
   * ==============  获取state注入代码
   * 渲染器会将 context.state 数据对象内联到页面模板中
   * 最终发送给客户端的页面会包含一段脚本：window.__INITIAL_STATE__ = context.state
   * context.state 是预取的、存放在服务端 store 容器中的数据。
   * 客户端就要把页面中的 window.__INITIAL_STATE__ 拿出来填充到客户端的 store 容器中
   * context[Config.stateContextKey] = stateData
   * const injectStateHtml = context.renderState({contextKey:Config.stateContextKey,windowKey:Config.stateWindowKey})
   * logger.log("injectStateHtml",injectStateHtml)
   */
  const rendeResult = await vueServerRender.renderToString(vm,context).catch(e=>e)
  // =============== 可以获取组件中的style代码，如果编译的时候选择了style注入代码
  //  const htmlStyles = context.renderStyles() 
  if(rendeResult instanceof Error){
    logger.error(rendeResult)
    return false
  }
  return rendeResult
}
// 获取app渲染模板html
async function getAppTemplate(){
  let appTemplate = await readFile(getAbsolutePath('app.template.html')).catch(e=>false)
  if(!appTemplate){
    appTemplate = await readFile(getAbsolutePath('template/app.template.html',true))
  }
  return appTemplate
}