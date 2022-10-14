import {join} from "path"
import chokidar  from "chokidar"
import {rollup} from "rollup"
import {parse as acornParse} from "acorn"
import loadConfigFile from "rollup/loadConfigFile"
import {logger,getAbsolutePath,isComponent,runtimeRollupConfigPath,md5,getVueFileInfo,writeManifest, getSfcType } from "./utils.js"
const pageManifest = {
  'layout':{},
  'page':{}
}
const pageRelativeFiles = {}
// ============================================= watcher
export default async function(config,onFinished){
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
  const watcher = chokidar.watch(watchPaths, {
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
        await changeOpVueSFC(filepath,config)
      })
      watcher.on('change', async(filepath, stats) => {
        await changeOpVueSFC(filepath,config)
      })
    }else{
      watcher.close()
    }
    onFinished&&onFinished.call(null,pageManifest)
  })
}
// 变更时只处理vuesfc文件
async function changeOpVueSFC(filepath,config){
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
  // 纯用api的方式或者mjs加载有问题[unplugin-vue-component]不生效。而使用loadConfigFile方式加载，rollup会自动转换为cjs ，才会生效，奇怪
  // const rollupConfigFile = new URL('./rollup.config.js', import.meta.url).pathname
  const rollupConfig= await loadConfigFile(runtimeRollupConfigPath, { /**format: 'es'**/ })
  rollupConfig.warnings.flush()
  const options = rollupConfig.options
  for (const k in  options) {
    const isSsr = k==0
    // 防止变量覆盖复制一份处理
    const option = Object.assign({},options[k])
    // 1 编译
    // option.input = pageInfo.importId
    option.input = fpath
    const bundle = await rollup(option).catch(e=>{
      logger.error(e.message)
      return null
    })
    if(!bundle){
      return false
    }
    // 记录文件关联
    pageRelativeFiles[pageInfo.sourcePath] = bundle.watchFiles
    // 2 输出
    const outputOption = option.output[0]
    outputOption.file = join(config.dst_root,isSsr?pageInfo.dstServerJs:pageInfo.dstClientJs)
    outputOption.name = pageInfo.id
    const {output} = await bundle.write(outputOption)
    // 3 存储下关联文件列表(存一次，所以ssr的时候处理)
    if(!isSsr){
      const pageJson = {
        id:pageInfo.id,
        serverJs:pageInfo.dstServerJs,
        clientJs:pageInfo.dstClientJs,
        clientCss:pageInfo.dstClientCss,
      }
      for (const outputItem of output) {
         if(outputItem.type == 'asset' ){
          pageJson.cssVer = md5(outputItem.source)
         }else if(outputItem.type =="chunk" && outputItem.isEntry){
          // 解析js代码块,获取其中的layout & asyncData
          const result = {asyncData:false}
          if(ftype=='page'){result.layout="default"}
          for (const key in outputItem.modules) {
            if(key == fpath+'?rollup-plugin-vue=script.js'){
              const sourceResult = checkSource(outputItem.modules[key].code,ftype=='page')
              Object.assign(result,sourceResult)
            }
          }
          Object.assign(pageJson,result)
          // 因为rollup-plugin-vue 中 如果style块是scope那么在js中的定义会增加scopeid会根据源码生成导致js文件hash变化
          pageJson.jsVer = md5(outputItem.code)
         }
      }
      pageManifest[pageInfo.type][pageInfo.relativePath] = pageJson
    }
  }
}

// 检查 源码中的 asyncData ,layout
function checkSource(code,checkLayout=true){
  const result = {asyncData:false}
  const estree = acornParse(code, {
    // ecmaVersion: 7,
    ecmaVersion: 2020,
    // sourceType:'script', //module
    // 如果为false，则使用保留字会产生错误。 对于ecmaVersion 3，默认为true，对于较高版本，默认为false
    // allowReserved:false,
    // locations:true,
    })
  if(estree && estree.type=='Program'){
    estree.body.map(body=>body.declarations.map(node=>{
        if(node.type=='VariableDeclarator' && 
          node.id.type=='Identifier' && 
          node.id.name=='script' && 
          node.init.type=='ObjectExpression'){
            // console.log('>>>>>>>>>>:',node.init.properties)
          return node.init.properties.map(n=>{
            if(n.type=='Property' && n.key.type=='Identifier'){
              // console.log(">>>>>>>>>>>>>>",n)
              if(checkLayout && n.key.name =='layout' && n.value.type=='Literal'){
                result.layout = n.value.value
              }
              if(n.key.name=='asyncData' && n.value.type == 'FunctionExpression'){
                result.asyncData = true
              }
            }
          })
        }
    }))
  }
  return result
}