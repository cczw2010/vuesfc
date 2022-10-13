import {compiler} from "vuesfc"
process.env.NODE_ENV = 'development'
compiler((manifest)=>{
      console.log(manifest)
    })
