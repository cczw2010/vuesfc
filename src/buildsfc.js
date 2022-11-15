import {join} from "path"
import chokidar  from "chokidar"
import {rollup} from "rollup"
import {getSfcInfo} from "./rollup-plugin-sfccheck.js"
// import loadConfigFile from "rollup/loadConfigFile"
import {logger,getAbsolutePath,isComponent,rollupServerConfigPath,rollupClientConfigPath,md5,getVueFileInfo,writeManifest, getSfcType } from "./utils.js"
import { pathToFileURL } from "url"
const pageManifest = {
  'layout':{},
  'page':{}
}
const pageRelativeFiles = {}
// ============================================= watcher
let watcher = null
const fileResolvers = {}  //文件和相应的变更后的回调函数，用于扩展
export async function sfcCompiler(config,onFinished){
  Object.assign(pageManifest,{
      'root':config.dst_root,
      'app':{
        'ssr':config.appSSRPath,
        'client':config.appClientPath
      }
  })
  let watchPaths = [
    getAbsolutePath(join(config.source_page,`**/*${config.source_ext}`)),
    getAbsolutePath(join(config.source_component,`**/*${config.source_ext}`)),
    getAbsolutePath(join(config.source_layout,`**/*${config.source_ext}`))
  ]
  // logger.log("watchPath",watchPath)
  watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    interval: 150,
  })
  // ready 有时候会触发两遍，这里做个限定
  let isReady = false
  watcher.on('ready', async() => {
    if(isReady){return}
    isReady = true
    logger.start("page complier beginning")
    // 遍历执行
    const watchFiles = watcher.getWatched()
    for(const fdir in watchFiles){
      for (const fname of watchFiles[fdir]) {
        const fpath = join(fdir,fname)
        if(!isComponent(fpath,config)){
          await complierVueSFC(fpath,config)
        }
      }
    }
    logger.success("page complier finished")
    await writeManifest(pageManifest)
    if(config.isDev){
      logger.ready("waiting for change...")
      watcher.on('add', async filepath =>{
        await onFileChange(filepath,config)
      })
      watcher.on('change', async(filepath, stats) => {
        // 如果有额外的自定义的文件处理方法
        if(filepath in fileResolvers){
          return fileResolvers[filepath].call(null)
        }
        await onFileChange(filepath,config)
      })
    }else{
      await watcher.close()
    }
    onFinished&&onFinished.call(null,pageManifest)
  })
  return watcher
}
// 单独增加监控文件及文件变更的对应的处理方法 ， isDev下才有效，且要在watcher启动只有有效
export function setWatcherResolver(filepath,resolver){
  watcher && watcher.add(filepath)
  fileResolvers[filepath] = resolver
}
// 变更时只处理vuesfc文件
async function onFileChange(filepath,config){
  const ftype = getSfcType(filepath,config)
  if(ftype=="layout" || ftype=="page"){
    await complierVueSFC(filepath,config)
    logger.success(`[${ftype}] complier finished`)
    
  }else if(ftype=="component"){
    // 判断关联的page执行编译
    for (const pagePath in pageRelativeFiles) {
      if(pageRelativeFiles[pagePath].indexOf(filepath)>=0){
        await complierVueSFC(pagePath,config)
        logger.success(`[${ftype}] complier finished`)
      }
    }
  }else{
    return false
  }
  await writeManifest(pageManifest)
}

// ==================== vue SFC文件编译方法====================
// 编译某个vue sfc页面组件文件，插件会自动组合layout和page及相关组件，生成服务端和客户端js执行文件
async function complierVueSFC(fpath,config){
  const pageInfo = getVueFileInfo(fpath,config)
  if(!pageInfo){return false}
  const ftype = getSfcType(fpath,config)
  logger.info(`compiler [${ftype}]: ${fpath}`)
  // logger.info(`compiler page :`,pageInfo)
  const outputServer = await rollupSfc(pageInfo,true)
  const output = await rollupSfc(pageInfo,false)
  if(outputServer && output){
    const pageJson = {
      id:pageInfo.id,
      serverJs:pageInfo.dstServerJs,
      clientJs:pageInfo.dstClientJs,
      clientCss:pageInfo.dstClientCss,
    }
    // server jsVer 以服务端为主，因为asyncData和head目前不会影响client端代码，所以服务端变了 客户端也不会变，主要用于开发模式下
    for (const outputItem of outputServer) {
      if(outputItem.type =="chunk" && outputItem.isEntry){
        // rollup-plugin-vue 中 如果style块是scope那么在js中的定义会增加scopeid会根据源码生成导致js文件hash变化
        pageJson.jsVerSsr = md5(outputItem.code)
      }
    }
    // client cssVer
    for (const outputItem of output) {
      if(outputItem.type == 'asset' ){
        pageJson.cssVer = md5(outputItem.source)
      }else if(outputItem.type =="chunk" && outputItem.isEntry){
        const result = getSfcInfo()
        // console.debug(">>>>>>>>>>>>>>><<<<<<<<<<<<<<<",fpath,result)
        if(ftype!='page'){
          delete result.layout
        }
        Object.assign(pageJson,result)
        // rollup-plugin-vue 中 如果style块是scope那么在js中的定义会增加scopeid会根据源码生成导致js文件hash变化，主要用于开发模式下
        pageJson.jsVer = md5(outputItem.code)
      }
    }
    pageManifest[pageInfo.type][pageInfo.relativePath] = pageJson
  }
}

async function rollupSfc(pageInfo,ssr){
  const rollupConfigPath =  pathToFileURL(ssr?rollupServerConfigPath:rollupClientConfigPath)
  // 每次都要重新载入，否则会缓存，postcss 会讲多个入口文件的css混合
  const {inputOption,outputOption} = await import(rollupConfigPath+'?'+Date.now())
  // 1 编译
  inputOption.input = pageInfo.sourcePath
  const bundle = await rollup(inputOption).catch(e=>{
    logger.error(e.message)
    return null
  })
  if(!bundle){
    return false
  }
  // 2 记录文件关联
  pageRelativeFiles[pageInfo.sourcePath] = bundle.watchFiles
  // 3 输出
  outputOption.file = join(pageInfo.dstRoot,ssr?pageInfo.dstServerJs:pageInfo.dstClientJs)
  outputOption.name = pageInfo.id
  const {output} = await bundle.write(outputOption)
  await bundle.close()
  return output
}