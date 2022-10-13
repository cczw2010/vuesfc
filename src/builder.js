import {join} from "path"
import chokidar  from "chokidar"
import {rollup} from "rollup"
import loadConfigFile from "rollup/loadConfigFile"
import {logger,getAbsolutePath,getRuntimeConfig,runtimeRollupConfigPath,md5 } from "./utils.js"
import {getPageInfo,isPage,writeManifest} from "./buildUtils.js"
const config = await getRuntimeConfig()
const pageManifest = {'root':config.dst_root}
const pageRelativeFiles = {}
// ============================================= watcher
export default async function(isWatching=false,onFinished){
  let watchPaths = [
    getAbsolutePath(join(config.source_page,`**/*.${config.source_ext}`)),
    getAbsolutePath(join(config.source_component,`**/*.${config.source_ext}`)),
    getAbsolutePath(join(config.source_layout,`**/*.${config.source_ext}`))
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
        if(isPage(fpath,config)){
          await complierVueSFC(fpath)
        }
      }
    }
    logger.success("page complier finished")
    await saveManifest()
    if(isWatching){
      logger.ready("waiting for change...")
      watcher.on('add', async filepath =>{
        if(isPage(filepath,config)){
          await complierVueSFC(filepath)
          await saveManifest()
        }
      })
      watcher.on('change', async(filepath, stats) => {
        if(isPage(filepath,config)){
          await complierVueSFC(filepath)
          logger.success("page complier finished")
        }else{
        // 判断关联的page执行编译
          for (const pagePath in pageRelativeFiles) {
            if(pageRelativeFiles[pagePath].indexOf(filepath)>=0){
              await complierVueSFC(pagePath)
              logger.success("page complier finished")
            }
          }
        }
        await saveManifest()
      })
    }else{
      watcher.close()
    }
    onFinished&&onFinished.call(null,pageManifest)
  })
}

// ==================== vue SFC文件编译方法====================
// 编译某个vue sfc页面组件文件，插件会自动组合layout和page及相关组件，生成服务端和客户端js执行文件
async function complierVueSFC(page){
  const pageInfo = getPageInfo(page,config)
  logger.info(`compiler page : ${pageInfo.relativePath}`)
  // 纯用api的方式或者mjs加载有问题[unplugin-vue-component]不生效。而使用loadConfigFile方式加载，rollup会自动转换为cjs ，才会生效，奇怪
  // const rollupConfigFile = new URL('./rollup.config.js', import.meta.url).pathname
  const rollupConfig= await loadConfigFile(runtimeRollupConfigPath, { /**format: 'es'**/ })
  rollupConfig.warnings.flush();
  const options = rollupConfig.options
  for (const k in  options) {
    const isSsr = k==0
    // 防止变量覆盖复制一份处理
    const option = Object.assign({},options[k])
    // 1 编译
    option.input = pageInfo.importId
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
    const {output} = await bundle.write(outputOption)

    // 3 存储下关联文件列表(存一次，所以ssr的时候处理)
    if(!isSsr){
      const pageJson = {
        serverJs:pageInfo.dstServerJs,
        clientJs:pageInfo.dstClientJs,
        clientCss:pageInfo.dstClientCss,
      }
      for (const outputItem of output) {
         if(outputItem.type == 'asset' ){
          pageJson.cssVer = md5(outputItem.source)
         }else if(outputItem.type =="chunk" && outputItem.isEntry){
          // 因为rollup-plugin-vue 中 如果style块是scope那么在js中的定义会增加scopeid会根据源码生成导致js文件hash变化
          pageJson.jsVer = md5(outputItem.code)
         }
      }
      pageManifest[pageInfo.relativePath] = pageJson
    }
  }
}


async function saveManifest(){
  return await writeManifest(pageManifest)
}