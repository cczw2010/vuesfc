<style scoped>
  .home{
    color:brown
  }
</style>
<template>
  <v-row justify="center">
    <v-date-picker v-model="dates"  multiple ></v-date-picker>
  </v-row>
</template>
<script type="text/javascript">
  export default {
    asyncData(data){
      return {
        title : data.title
      }
    },
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
        dates: ['2021-09-15', '2021-09-20'],
      }
    },
    methods:{
     
    }
  }
</script>