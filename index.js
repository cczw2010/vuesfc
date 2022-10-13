import {join} from "path"
import deepmerge from "deepmerge"
import write from "write"
import { getAbsolutePath,logger,distRootDir,clientManifestPath,saveRuntimeConfig,runtimeRollupConfigPath,compilerTemplate} from "./src/utils.js"
import {compiler as moduleCompiler} from "./src/module.js"
import appCompiler from "./src/buildapp.js"
import sfcCompiler from "./src/buildsfc.js"
import defConfig from "./config.js"
import {renderer,getRenderInfo} from "./src/render.js"
/**
 *编译vue sfc方法，支持监控变动
 * @export
 * @param {function} onFinished 第一次编译完成之后的回调
 * @param {boolean} isWatching  是否持续监控文件并实时编译相关的页面
 */
async function compiler(onFinished,isWatching){
  // 1 初始化并生成本地配置文件
  const config = await initConfig()
  if(!config){return}
  // 2 预编译第三方模块
  await moduleCompiler(config.buildModules,config.dst_root,config.moduleLoaderSSRPath,config.moduleLoaderClientPath)
  // console.log("config",config)
  // 3 执行编译app.js
  let result = await appCompiler(config,true)
  if(result===false){
    return 
  }
  result = await appCompiler(config)
  if(result===false){
    return 
  }
  // 4 执行编译  需要初始化配置信息之后，所以动态加载
  result = await sfcCompiler(config,isWatching,onFinished)
}

/**
 * 初始化生成配置文件，供rollup.config.mjs直接使用
 * @returns object
 */
async function initConfig(){
  try{
    // 读取本地配置文件并合并
    const localConfig = await import(getAbsolutePath('vuesfc.config.js')).then(m=>{
      if(!m.default){
        logger.error('[vuesfc.config.js] must exoport with default ')
        return false
      }
      return m.default
    }).catch(e=>{
      if(e.code=='ERR_MODULE_NOT_FOUND'){
        return {}
      }
      logger.error(e)
      return false
    })
    if(!localConfig){
      return
    }
    const config = deepmerge(defConfig,localConfig)
    // 将路径部分设成绝对路径
    config.source_page = getAbsolutePath(config.source_page)
    config.source_layout = getAbsolutePath(config.source_layout)
    config.source_component = getAbsolutePath(config.source_component)
    // 编译相关目录，到主项目目录下，引入依赖会出问题， 暂时放到包的目录下,但是多个项目依赖会有问题，待处理
    config.dst_root = distRootDir
    config.moduleLoaderSSRPath = join(config.dst_root,"moduleloader.server.js")
    config.moduleLoaderClientPath = join(config.dst_root,"moduleloader.client.js")
    config.appSourcePath = getAbsolutePath("./template/app.js",true)
    config.appSSRPath = "app.server.js"
    config.appClientPath = "app.bundle.js"
    config.dst_ext = ".js"
    await saveRuntimeConfig(config)
     // 生成rollup.config.js文件
    const rollupDst = await compilerTemplate(getAbsolutePath("./template/rollup.config.js",true),config)
    await write(runtimeRollupConfigPath,rollupDst)
    logger.info("config initialize ok")
    return config
  }catch(e){
    logger.error(e)
    process.exit(1)
  }
}

// export
export {distRootDir as rootDist ,clientManifestPath as versPath,compiler,renderer,getRenderInfo}
