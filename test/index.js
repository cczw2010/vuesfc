import * as acorn from "acorn"
import * as acornWalk from "acorn-walk"
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
    // console.log('>>>>>>>',index,prop,node.type,node)
    if(node.type!='Property'){
      this.skip()
    }
    if('asyncData'== node.key.name && node.value.type=='FunctionExpression'){
      console.log("........",index,prop,node.key,node.value,parent)
    }

    if('head'== node.key.name && ['FunctionExpression',"ObjectExpression"].includes(node.value.type)){
      console.log("........",index,prop,node.key,node.value,parent)
      // magicString.overwrite(node.start, node.end, '')
      magicString.remove(node.start, node.end)
      console.log('>>>>>',magicString.lastChar())
      // s.move( node.start, node.end, index )
      // this.remove()
      // this.replace(new_node) 
      // this.skip()
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