import  {renderer} from "vuesfc";
import write from "write"
const html = await renderer("home.vue",{title:'this is vuetify demo'})

write("./dist/home.html",html)