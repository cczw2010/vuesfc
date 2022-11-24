import {join} from "path"
import deepmerge from "deepmerge"
import write from "write"
import { existsSync} from "fs"
import {copyFile} from "fs/promises"
import { getAbsolutePath,logger,rootPackage,distRootDir,projectConfigPath,getLocalConfig,clientManifestPath,saveRuntimeConfig,rollupServerConfigPath,rollupClientConfigPath,getRuntimeConfig} from "./src/utils.js"
import {compiler as moduleCompiler} from "./src/module.js"
import appCompiler from "./src/buildapp.js"
import {sfcCompiler,setWatcherResolver} from "./src/buildsfc.js"
import defConfig from "./config.js"
import {renderer,getRenderInfo} from "./src/render.js"

await initBableConfigFile()
/**
 *编译vue项目，开发模式下会实时监控变动
 * @export
 * @param {function} onFinished 编译完成之后的回调
 * @param {boolean} [isDev=false] 是否开发模式
 */
async function compiler(onFinished,isDev=false){
  // 1 初始化并生成本地配置文件
  const config = await initConfig(isDev)
  if(!config){return}
  // 2 预编译第三方模块
  await moduleCompiler(config.buildModules,config.dst_root,config.moduleLoaderSSRPath,config.moduleLoaderClientPath)
  // console.log("config",config)
  // 3 执行编译app.js
  let result = await appCompiler(config,true)
  if(result===false){
    process.exit(1)
  }
  result = await appCompiler(config)
  if(result===false){
    process.exit(1)
  }
  // 4 执行编译  需要初始化配置信息之后，所以动态加载
  let watcher = await sfcCompiler(config,()=>{
    // 开发模式下，项目下的配置文件变更重新编译
    if(isDev){
      setWatcherResolver(projectConfigPath,()=>{
        logger.warn('[vsfc.config.js] file changed, vue compiler restarting... ')
        watcher.close().then(()=>{
          watcher = null
          compiler(onFinished,isDev)
        })
      })
    }
    onFinished && onFinished()
  })
  
}

/**
 * 初始化生成配置文件，供rollup.config.mjs直接使用
 * @returns object
 */
async function initConfig(isDev){
  try{
    // 读取本地配置文件并合并
    const localConfig = await getLocalConfig()
    if(!localConfig){
      return
    }
    let config = deepmerge(defConfig,localConfig)
    config.isDev = isDev
    // 将路径部分设成绝对路径
    config.source_page = getAbsolutePath(config.source_page)
    config.source_layout = getAbsolutePath(config.source_layout)
    config.source_component = getAbsolutePath(config.source_component)
    config.source_components = sfcCommponentsDirs.concat(config.source_component)
    // 编译相关目录，到主项目目录下，引入依赖会出问题， 暂时放到包的目录下,但是多个项目依赖会有问题，待处理
    config.dst_root = distRootDir
    config.appSourcePath = getAbsolutePath("./template/app.js",true)
    config.moduleLoaderSSRPath = join(config.dst_root,"moduleloader.server.js")
    config.moduleLoaderClientPath = join(config.dst_root,"moduleloader.client.js")
    config.appSSRPath = "app.server.js"
    config.appClientPath = "app.bundle.js"
    config.dst_ext = ".js"
    // 保存config.js
    await saveRuntimeConfig(config)
    // 生成rollup.config.js文件
    // const rollupDst = await compilerTemplate(getAbsolutePath("./template/rollup.config.js",true),config)
    // await write(runtimeRollupConfigPath,rollupDst)
    await copyFile(getAbsolutePath("./template/rollup.config.server.js",true),rollupServerConfigPath)
    await copyFile(getAbsolutePath("./template/rollup.config.client.js",true),rollupClientConfigPath)
    logger.info("config initialize ok")
    process.env.vsfcPackageRoot = rootPackage
    return config
  }catch(e){
    logger.error(e)
    process.exit(1)
  }
}

let sfcCommponentsDirs = []
// 设置打包vue sfc的时候自动加载的组件库的预加载目录数组，需要在compiler之前执行方有效
function setVueComponentDirs(dirs){
  sfcCommponentsDirs = [].concat(dirs)
}

// copy bable相关配置文件到项目目录（only run once）
async function initBableConfigFile(){
  const dstBableFile = getAbsolutePath('babel.config.json')
  const dstBrowserslistrcFile = getAbsolutePath('.browserslistrc')
  if(!existsSync(dstBrowserslistrcFile) && !existsSync(dstBableFile)){
    await write(dstBableFile,'{\r\n\t"presets":[["@babel/preset-env"]]\r\n}')
    await write(dstBrowserslistrcFile,'> 0.25%\nnot dead')
  }
}

// export
export {distRootDir as rootDist ,clientManifestPath as versPath,getLocalConfig,getRuntimeConfig,setVueComponentDirs,compiler,renderer,getRenderInfo}
