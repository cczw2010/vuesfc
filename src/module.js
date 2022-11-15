// 预编译第三方模块
import {resolve} from "path"
import { pathToFileURL } from "url"
import write from "write"
import { getAbsolutePath,compilerTemplate,logger } from "./utils.js"
// 默认加载的内置module
const defModule = {}
/**
 *根据配置预编译各个模块（vuetify等）
 * @export
 * @param {object} options  模块配置对象 {moduleName:options,...}
 * @param {string} dstRoot  modules输出地址
 * @param {string} moduleLoaderSSRPath  moduleloader文件ssr输出地址
 * @param {string} moduleLoaderClientPath  moduleloader文件client输出地址
 * @returns 每个模块编译后文件的地址映射对象
 */
export async function compiler(options,dstRoot,moduleLoaderSSRPath,moduleLoaderClientPath){
  options = Object.assign({},defModule,options)
  const modulesSSR = {}
  const modulesClient = {}
  // 循环编译每个模块
  let count = 0
  for(const moduleName in options){
    try{
      // vue第三方编译modules的根目录
      let moduleSourcePath = null
      // 自定义编译组件
      if(moduleName.startsWith("~")){
        moduleSourcePath =  moduleName.replace(/^~/ig,process.cwd())
      }else{
        moduleSourcePath = resolve(modulesRoot,moduleName)
      }
      const moduleServerDstPath = resolve(dstRoot,`module_${count}.server.js`)
      const moduleClientDstPath = resolve(dstRoot,`module_${count}.client.js`)
      count++
      logger.info(`compiler build module: [${moduleName}]`)
      const moduleConfig = options[moduleName]||{}
      // 模板编译
      moduleConfig.ssr = false
      const codeclient = await compilerTemplate(moduleSourcePath,moduleConfig,false)
      moduleConfig.ssr = true
      const codessr = await compilerTemplate(moduleSourcePath,moduleConfig,false)
      // 写入文件
      await write(moduleServerDstPath,codessr)
      await write(moduleClientDstPath,codeclient)

      modulesSSR[moduleName] = JSON.stringify(moduleServerDstPath)
      modulesClient[moduleName] = JSON.stringify(moduleClientDstPath)
    }catch(e){
      logger.error(e)
      return null
    }
  }

  // 编译生成入口文件
  const moudleLoaderTpl = getAbsolutePath("template/module.js",true)
  logger.info(`compiler module loader...`)
  const codeSsr = await compilerTemplate(moudleLoaderTpl,modulesSSR)
  const codeClient = await compilerTemplate(moudleLoaderTpl,modulesClient)
  await write(moduleLoaderSSRPath,codeSsr)
  await write(moduleLoaderClientPath,codeClient)

  return {ssr:codeSsr,client:codeClient}
}
