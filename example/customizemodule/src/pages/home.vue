<style scoped>
  .home{
    color:brown
  }
</style>

<template>
  <div class="home">
    <p>{{title}}</p>
    <h2>vue-js-toggle-button</h2>
    <toggle-button :value="true" :labels="{checked: 'Foo', unchecked: 'Bar'}"/>
    <h2>vue-notification</h2>
    <VButton title="vue-notification" v-on:click.native="onNotify"></VButton>
    <notifications group="app"/>
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
    data(){
      return {
        title:"Customize modules width third-party vue components ",
      }
    },
    methods:{
      onNotify(){
        this.$notify({ group: 'app', text: 'this is a notify example' })
      },
    },
    mounted(){
      // this.$notify({ group: 'app', text: 'this is a notify example' })
    }
  }
</script>