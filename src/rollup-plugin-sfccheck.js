import {parse} from "acorn"
import MagicString from "magic-string"
import {walk} from "estree-walker"

let result = null
// 获取本次的信息,有时效性
export function getSfcInfo(){
  return Object.assign({},result)
}
/**
 * 可以传入 一个对象
 *
 * @export
 * @param {*} returns
 * @returns
 */
export default function(returns){
  let sourceId = null
  return {
    name: 'sfccheck',
    resolveId ( source,importer,options ) {
      // 每次一次入口都要初始化一次,防止数据混淆
      if(options.isEntry && !importer){
        sourceId = source
        result = null
      }
      return null;
    },
    transform ( code,id) {
      if(id == sourceId+'?rollup-plugin-vue=script.js'){
        // console.debug("\n",id)
        result = {layout:'default',asyncData:false,head:false}
        const s = new MagicString(code)
        const ast = parse(code, {ecmaVersion: 2020,sourceType:'module'})
        walk(ast, {
          enter(node, parent, prop, index) {
            // console.debug('>>>>>>>enter：',index,prop,node.type)
            if(prop=='body' && parent && parent.type=='Program' && node.type=='ExportDefaultDeclaration' && node.declaration.type == 'ObjectExpression'){
              // console.debug(node)
              const maxIdx = node.declaration.properties.length-1
              if(maxIdx>=0){
                node.declaration.properties.forEach((property,idx) => {
                  //======1 asyncData [FunctionExpression]
                  // console.log('>>>>>>>>',property)
                  if('asyncData'== property.key.name){
                    result.asyncData = true
                    // 如果有下一个属性，他们之间一般是【，】要一起删除
                    let end = maxIdx>idx?(node.declaration.properties[idx+1].start-1):property.end
                    s.remove(property.start, end)
                  }
                  //======2 head  [FunctionExpression||ObjectExpression]
                  if('head'== property.key.name){
                    result.head = true
                    // 如果有下一个属性，他们之间一般是【，】要一起删除
                    let end = maxIdx>idx?(node.declaration.properties[idx+1].start-1):property.end
                    s.remove(property.start, end)
                  }
                  //======3 layout
                  if('layout'== property.key.name){
                    result.layout = property.value.value||'default'
                  }
                })
                // 没有layout设定的话，layout默认default,并插入代码，非必要
                // if(!layout){
                //   layout = 'default'
                //   // console.debug(">>>>>>>> nolayout, inject")
                //   s.appendLeft(node.declaration.properties[0].start,'layout:"default",\n')
                // }
              }
              // console.debug('-----------',result)
              // 终止当前node tree树的遍历
              this.skip()
            }
          },
          // leave(node, parent, prop, index) {
          //   console.debug('>>>>>>>leave：',index,prop,node.type)
          // }
        });
        // 赋值传入的对象
        s.trimLines()
        return s.toString()
      }
      return null
    }
  }
}