import {compiler} from "vuesfc"
const isWatching = process.argv[2]=="-w"
compiler((manifest)=>{
  console.log(manifest)
},isWatching)
