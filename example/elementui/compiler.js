import {compiler} from "vuesfcbuilder"

const isWatching = process.argv[2]=="-w"
compiler(isWatching,{
                  isDev:true,
                  // page源码目录
                  source_page:"src/pages",
                  // layout源码目录
                  source_layout: "src/layouts",
                  // 自定义component源码目录
                  source_component: "src/components",
                  buildModules:{
                    '~/modules/elementui.js':{
                      option:{locale:"en"}
                    }
                  },
                  rollupExternal:['element-ui'],
                  rollupGlobals:{"element-ui":"ELEMENT"}
                },(manifest)=>{
                  console.log(manifest)
                })
