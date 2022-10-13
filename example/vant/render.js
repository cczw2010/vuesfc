import  {renderer} from "vuesfcbuilder";
import write from "write"
const html = await renderer("home.vue",{title:'this is vant demo'})

write("./dist/home.html",html)