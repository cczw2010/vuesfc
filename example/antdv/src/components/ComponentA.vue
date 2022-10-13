<style  scoped>
  .button{
    color:green
  }
</style>

<template>
  <button class="button" v-on:click="++count">{{title}}:{{count}}</button>
</template>
<script type="text/javascript">
  export default {
    props: {
      title: String,
    },
    data(){
      return {
        count:0
      }
    }
  }
</script>