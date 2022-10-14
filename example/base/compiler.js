import {compiler} from "vuesfc"
const isDev = false
compiler((manifest)=>{
      console.log(manifest)
    },isDev)
