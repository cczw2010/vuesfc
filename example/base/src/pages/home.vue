<style scoped lang="less">
  @base: #ff6600;
  .home{
    color: saturate(@base, 50%);
  }
  .active{
    color:green
  }
</style>

<template>
  <div class="home">
    <h1 v-bind:class="{home:!!title,active:true}">{{title}}</h1>
    <ul id="list"> 
      <li v-for="item in items" v-bind:key="item" v-on:click="test">{{item}}</li>
    </ul>
    <ComponentA></ComponentA>
  </div>
</template>
<script type="text/javascript">
  export default {
    head(){
      return {
        title:this.title,
        style: [
          { cssText: '.headhome { color: red }', type: 'text/css' }
        ]
      }
    },
    layout:'default',
    async asyncData(data){
      // return data||{}
      return {
        title:'async page title'
      }
    },
    data(){
      return {
        title:"page title",
        items:[1,2,3,4,5,6]
      }
    },
    methods:{
      test(){
        console.log('this is a test')
      }
    }
  }
</script>