import {compiler} from "vuesfc"
const isDev = true
compiler((manifest)=>{
      console.log(manifest)
    },isDev)
