// lodash template 文件，传入vue的配置信息为数据 options
// injects
const injects = {}
// metas
const metas = {}
<% 
let idx = 0
for (const key in options) {
  const moduleName =`module_b${idx++}`
%>
import <%=moduleName%> from "<%=options[key]%>"
const obj<%=moduleName%> = <%=moduleName%>()
Object.assign(injects,obj<%=moduleName%>.inject)
if(obj<%=moduleName%>.meta){
  metas[<%=moduleName%>] = obj<%=moduleName%>.meta
}
<%} %>
export {metas,injects}