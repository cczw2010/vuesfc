import {compiler} from "vsfc"
const isDev = false
compiler((manifest)=>{
      console.log(manifest)
    },isDev)
