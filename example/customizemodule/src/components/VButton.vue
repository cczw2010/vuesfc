<style  scoped>
  .button{
    background: #669900;
    color: #fff;
    padding: 10px 20px;
  }
</style>

<template>
  <button class="button" >{{title}}</button>
</template>
<script type="text/javascript">
  export default {
    props: {
      title: String
    }
  }
</script>