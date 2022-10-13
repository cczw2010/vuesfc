<style scoped>
  .app-layout1{
    margin:0;padding:0;
    background:#ccc
  }
</style>
<template>
  <div class="app-layout1">
    <h1>{{title}}</h1>
    <hr/>
    <custom-page ref="page"/>
  </div>
</template>
<script>

export default {
  head:{
      meta:[
        {charset: 'utf-8'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {name: 'keywords', content: 'test' }
      ],
  },
  asyncData(data){
    return {
      title : 'asyncData lauout title1'
    }
  },
  data(){
    return {
      title : 'layout title'
    }
  }
}
</script>