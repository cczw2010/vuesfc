<style scoped>
  .app-layout{
    margin:0;padding:0;
    background:#ccc
  }
</style>
<template>
  <div class="app-layout">
    <h1>{{title}}</h1>
    <hr/>
    <custom-page ref="page"/>
  </div>
</template>
<script>

export default {
  head:{
      title:"vuesfcbuilder demo",
      meta:[
        {charset: 'utf-8'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {name: 'keywords', content: 'test' }
      ],
  },
  data(){
    return {
      title:'custom third build module demo'
    }
  }
}
</script>