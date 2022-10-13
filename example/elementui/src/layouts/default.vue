<style scoped>
  .app-layout{
    margin:0;padding:0;
    background:#ccc
  }
</style>
<template>
  <div class="app-layout">
    <h1 v-on:click="onClick">{{title}}</h1>
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
      // link: [
      //   { rel: 'favicon', href: 'favicon.ico' }
      // ],
      // script: [
      //   { src: 'https://cdn.jsdelivr.net/npm/vue@2.6.14' },
      // ],
  },
  data(){
    return {
      title:'vuesfcbuilder demo'
    }
  },
  methods:{
    onClick(){
      console.log('onClick title')
    }
  }
}
</script>