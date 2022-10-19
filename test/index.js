import * as acorn from "acorn"
import * as eswalk from "estree-walker"
import MagicString from 'magic-string';
const sourceCode = `
const __vue_script__$2 = script$2;
var script = {
  head(){

    return {

      title:"后台管理系统-koavc",
      
      meta:[

        {charset: 'utf-8'},

        {name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {name: 'keywords', content: 'test' }





      ],
      script: [
        { src: '/public/static/js/axios.min.js' }
      ],



    }
  },
  async asyncData(data,ctx){
    const rightModule =await ctx.loadModel("rights");
    const menus = await rightModule.list();
    // console.log(menus)
    return {


      activeMenuId:ctx.path,
      menus
    }
  },
  data(){
    return {
      // async
      loading:false,
      percentage:0,
      // 
      isCollapse:false,
      logoUrl:"/public/static/img/logo.png",
      userAvator:"/public/static/img/dog.jpg",
      showDialogModifypass:false,
    }
  },
  computed:{
    iconAsideMenu(){
      return this.isCollapse?"el-icon-s-unfold":"el-icon-s-fold"
    }
  },
};
`

const magicString = new MagicString(sourceCode)
const ast = acorn.parse(sourceCode, {ecmaVersion: 2020}); // https://github.com/acornjs/acorn
eswalk.walk(ast, {
  enter(node, parent, prop, index) {
    // some code happens
    console.log('>>>>>>>',index,prop,node.type)
    if(index>=0 && node.type=='Property' && parent.type=='ObjectExpression'){
      if('asyncData'== node.key.name && node.value.type=='FunctionExpression'){
        console.log("........asyncData",node)
        let end = node.end
        // 如果有下一个属性，他们之间一般是【，】要一起删除
        if(parent.properties.length-1>index){
          end = parent.properties[index+1].start-1
        }
        magicString.remove(node.start, end)
        this.skip()        // 不往下级走了
        return
      }
      if('head'== node.key.name && ['FunctionExpression',"ObjectExpression"].includes(node.value.type)){
        console.log("........head",node)
        let end = node.end
        // 如果有下一个属性，他们之间一般是【，】要一起删除
        if(parent.properties.length-1>index){
          end = parent.properties[index+1].start-1
        }
        magicString.remove(node.start, end)
        this.skip()        // 不往下级走了
        return
      }
    }
  },
  leave(node, parent, prop, index) {
    // if(node.type=='Property' && node.key.name == 'asyncData' && node.value.type=='FunctionExpression'){
    //   console.log('<<<<<<<',index,prop,node.key,node.value,parent)
    // }
    // some code happens
  }
});
magicString.trimLines()
console.log(magicString.toString())