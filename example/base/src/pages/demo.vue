<style scoped lang="less">
  @base: #ff6600;
  .demo{
    color: saturate(@base, 50%);
  }
  .active{
    color:red
  }
</style>

<template>
  <div class="demo">
    <componentA>{{title}}</componentA>
  </div>
</template>
<script type="text/javascript">
  export default {
    head(){
      return {
        title:this.title,
        style: [
          { cssText: '.headdemo { color: green }', type: 'text/css' }
        ]
      }
    },
    layout:'default1',
    data(){
      return {
        title:"vuesfcbuilder demo: base use>>>demo",
      }
    },
    methods:{
      test(){
        this.title+=':'+Date.now()
      }
    }
  }
</script>