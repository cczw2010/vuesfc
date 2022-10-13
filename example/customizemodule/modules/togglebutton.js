import Vue from 'vue'

<%if(options.ssr){%>
import ToggleButton from 'vue-js-toggle-button/dist/ssr.index.js'
<%}else{%>
import ToggleButton from 'vue-js-toggle-button'
<%}%>

Vue.use(ToggleButton)

export default function(){
  return {}
}