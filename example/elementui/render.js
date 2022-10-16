import  {renderer} from "vsfc";
import write from "write"
const html = await renderer("home.vue",{title:'this is elementui demo'})

write("./dist/home.html",html)