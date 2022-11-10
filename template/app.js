import Vue from 'vue'
import {injects} from "<%=options.moduleLoaderPath%>"
<%if(options.ssr){%>
import deepmerge from "deepmerge"
import {metas} from "<%=options.moduleLoaderPath%>"
<%}%>
import ClientOnly from 'vue-client-only'
Vue.component('ClientOnly',ClientOnly)
let instance = null
const globalData ={
  layoutName:'',
  pageName:''
}
const EventReady = 'apploadfinished'
const EventAsyncPageReady = 'asyncpageloadfinished'
// layout中显示page的组件
Vue.component('<%=options.pageComponentName%>', {
  data(){
    return globalData
  },
  template:'<div id="__page"><component :is="pageName"></component></div>'
})
// layout 和page 组件增加 预处理
function setCustomMixin(component,asyncData=null,isLayout=false){
  component.mixins = component.mixins||[]
  component.mixins.unshift({
    // beforeCreate(){},
    created(){
      if(!this.$isServer){
        // asyncData
        const realData = window['<%=options.stateWindowKey%>']||null
        if(realData){
          asyncData = isLayout?realData.layout[globalData.layoutName]:realData.page[globalData.pageName]
        }
      }
      if(asyncData){
        for (const key in asyncData) {
          this[key] = asyncData[key]
        }
      }
    },
    // beforeUpdate(){
    //   console.log("before Update:",this.$data)
    // },
  })
}
/**
 * 创建vue实例
 * @export
 * @returns app vm
 */
export function createApp(){
  let head = {}
  <%if(options.ssr){%>
    head = {script:[{src:'<%=options.isDev?options.vueUrlDev:options.vueUrl%>'}]}
    for (const mkey in metas) {
      head = deepmerge(head,metas[mkey])
    }
  <%}%>
  instance =  new Vue({
    head,
    data(){
      return globalData
    },
    ...injects,
    // render: h => h(vmLayout)
    template:'<div id="__layout"><component :is="layoutName"></component></div>'
  })
  return instance
}
/**
 * 设置当前layout组件
 * @param {string} componetName  页面上组件的变量名称
 * @param {object} vm  for ssr 
 * @param {*} asyncData  for ssr 
 */
export function setLayout(componetName,vm=null,asyncData=null){
  <%if(!options.ssr){%>
    window['<%=options.layoutNameKey%>'] = componetName
    vm = window[componetName]
  <%}%>
  setCustomMixin(vm,asyncData,true)
  Vue.component(componetName,vm)
  globalData.layoutName = componetName
}
/**
 * 设置当前page组件
 * @param {string} componetName  页面上组件的变量名称
 * @param {object} vm  for ssr 
 * @param {*} asyncData  for ssr 
 */
 export function setPage(componetName,vm=null,asyncData=null){
  <%if(!options.ssr){%>
    window['<%=options.pageNameKey%>'] = componetName
    vm = window[componetName]
  <%}%>
  setCustomMixin(vm,asyncData,false)
  Vue.component(componetName,vm)
  globalData.pageName = componetName
}
<%if(!options.ssr){%>
  // 获取实例
  export function getInstance(){
    return instance
  }
  // 动态加载其他页面, 数据信息由库提供的 getRenderInfo 方法返回
  export function setAsyncPage(renderInfo){
    const {id,state,style,script} = renderInfo
    // state
    if('page' in state){
      window['<%=options.stateWindowKey%>'].page[id] = state.page
    }
    // 如果界面上已经有该页面的assets注入了  不再注入
    if(window[id]){
      setPage(id)
      return 
    }
    // styles
    if(style){
      let domStyle = null
      <%if(options.injectUrl){%>
      domStyle = document.createElement("link")
      domStyle.href = style
      domStyle.rel="stylesheet"
      <%}else{%>
      domStyle = document.createElement("style")
      domStyle.innerHTML = style
      domStyle.type = 'text/css'
      <%}%>
      document.head.appendChild(domStyle)
    }
    // script
    if(script){
      const domScript = document.createElement("script")
      domScript.type="text/javascript"
      <%if(options.injectUrl){%>
      domScript.src = script
      domScript.onload = function(){
        <%=options.appName%>.__sendEvent(EventAsyncPageReady,id)
      }
      document.head.appendChild(domScript)
      <%}else{%>
      domScript.innerHTML = script
      document.head.appendChild(domScript)
      <%=options.appName%>.__sendEvent(EventAsyncPageReady,id)
      <%}%>
    }
  }
  // 注册事件, EventReady, 应用初次加载并初始化完成
  export function onReady(func){
    window.addEventListener(EventReady,func)
  }
  // 触发事件
  export function __sendEvent(eventName,data){
    const event = new CustomEvent(eventName, { 
        detail: data
    })
    if(window.dispatchEvent) {  
        window.dispatchEvent(event);
    } else {
        window.fireEvent(event);
    }
  }
  //====== 客户端自动执行
  window.Vue = Vue
  window.addEventListener("load",function(){
    // 初始化时获取页面上的组件名称
    setLayout(<%=options.layoutNameKey%>) 
    setPage(<%=options.pageNameKey%>)
    // page的bundle.js中最后会注入触发该事件的代码
    window.addEventListener(EventAsyncPageReady,function(e){
      setPage(e.detail) 
    })
    // init
    instance = createApp()
    //浏览器端挂载vue
    instance.$mount('[data-server-rendered]')
    // instance.$mount('#__layout',true)
    // 发送完成
    __sendEvent(EventReady)
  })
<%}%>
