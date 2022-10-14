import {join,isAbsolute,relative} from "path"
import write from "write"
import template from "lodash.template"
import { readFile} from "fs/promises"
import consola from "consola"
import hash from "hash-sum"

// 判断 node 和 window
export const isBrowser = globalThis.window && globalThis.document
// logger
export const logger = consola.withScope('build')
// 项目根目录
export const rootProject = process.env.PWD
// 本包根目录
export const rootPackage = new URL("../",import.meta.url).pathname
// md5
export function md5(data){
  // 以md5的格式创建一个哈希值
  // const hash = crypto.createHash('md5');
  // // return hash.update(data).digest('hex')
  // return hash.update(data).digest('hex').slice(0, num)
  return hash(data)
}

// 项目对应的唯一编译输出根目录地址
export const distRootDir = getAbsolutePath(`.vue/${md5(rootProject)}`,true)

// 项目对应的最终配置文件地址
export const runtimeConfigPath = join(distRootDir,'config.runtime.js')

// 项目对应的rollup配置文件地址,之所以单独生成，是因为【unplugin-vue-component】需要loadConfigFile
export const runtimeRollupConfigPath = join(distRootDir,'rollup.config.js')

export const clientManifestPath = join(distRootDir,'manifest.json')
/**
 * 获取绝对路径
 *
 * @export
 * @param {*} path  路径
 * @param {boolean} packagePath  相对于项目还是相对于当前包,默认false相对于项目
 * @returns string 
 */
 export function getAbsolutePath(path,packagePath){
  if(!isAbsolute(path)){
    const root = packagePath?rootPackage:rootProject
    return join(root,path)
  }
  return path
}
// 存储最终运行时的配置文件
export async function saveRuntimeConfig(config){
  // 存入文件
  const str= JSON.stringify(config)
  await write(runtimeConfigPath,`export default ${str}`)
}
// 获取项目生成的最终运行时配置文件
export async function getRuntimeConfig(){
  return await import(runtimeConfigPath).then(m=>m.default).catch(e=>{
    logger.error("vue runtime config get error. you must run [compiler] first.\n")
    process.exit(1)
  })
}

//判断绝对路径是:page,layout,component
export function getSfcType(fpath,Config){
  fpath = getAbsolutePath(fpath)
  if(!fpath.endsWith(Config.source_ext)){
    return false
  }
  if(fpath.startsWith(Config.source_component)){
    return 'component'
  }
  if(fpath.startsWith(Config.source_page)){
    return 'page'
  }
  if(fpath.startsWith(Config.source_layout)){
    return 'layout'
  }
  return false
}

// 判断是layout
export function isLayout(fpath,config){
  const ftype = getSfcType(fpath,config)
  return ftype == "layout"
}
// 判断是page
export function isPage(fpath,config){
  const ftype = getSfcType(fpath,config)
  return ftype == "page"
}
// 判断是自定义component
export function isComponent(fpath,config){
  const ftype = getSfcType(fpath,config)
  return ftype == "component"
}
  

/**
 * 编译lodash.template模板
 * @export
 * @param {string} source 源码或者源码文件路径
 * @param {object} data 注入页面的数据对象， 通过 options 对象名来访问
 * @param {boolean} [isTplSource=false]  指定source是否为源码code
 * @param {object}  [config=null] 全局的config对象，可选
 * @returns
 */
export async function compilerTemplate(source,data,isTplSource=false,config=null){
  let sourceTpl = source
  if(!isTplSource){
    sourceTpl = await readFile(source)
  }
  const options = {
    options:data||{},
    config
  }
  const compiled = template(sourceTpl)
  const dst = compiled(options)
  return dst
}

//根据传入的vue文件[*绝对路径]，获取vue文件对应的源码文件，编译后的文件地址等信息
export function getVueFileInfo(sourcePath,Config){
  const fileType = getSfcType(sourcePath,Config)
  if(fileType!="layout" && fileType!="page"){
    return false
  }
  const sourceTypePath = fileType=='layout'?Config.source_layout:Config.source_page
  const relativePath = relative(sourceTypePath,sourcePath)
  const id = 'c'+md5(relativePath)
  const dstServerJs = `${fileType}.${id}.server.js`
  const dstClientJs =  `${fileType}.${id}.bundle.js`
  const dstClientCss =  `${fileType}.${id}.bundle.css`

  return {
    id,
    sourcePath,
    type:fileType,
    relativePath,
    dstRoot:Config.dst_root,
    dstServerJs,
    dstClientJs,
    dstClientCss
  }
}

//写clientManifest文件
export async function writeManifest(pageManifest){
  const str = JSON.stringify(pageManifest)
  await write(clientManifestPath,str)
}

//获取生成的映射文件，返回映射对象
export async function getManifest(){
  try{
    const source = await readFile(clientManifestPath)
    return JSON.parse(source.toString("utf8"))
  }catch(e){
    logger.error('load manifest failed.',e.message)
    return false
  }
}