import  {renderer,getRenderInfo} from "vuesfcbuilder";
import write from "write"
const info = await getRenderInfo("demo.vue",{title:'aaa'})
console.log("================getRenderInfo:",info)
const html = await renderer("home.vue",{title:'this is example base'})
write("./dist/home.html",html)