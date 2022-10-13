<style scoped>
  .home{
    color:brown
  }
</style>

<template>
  <div class="home">
    <h1>{{title}}</h1>
    <van-picker
      title="标题"
      show-toolbar
      :columns="columns"
      @confirm="onConfirm"
      @cancel="onCancel"
      @change="onChange"
    />
  </div>
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
        columns: ['杭州', '宁波', '温州', '绍兴', '湖州', '嘉兴', '金华', '衢州'],
      }
    },
    methods:{
      onConfirm(value, index) {
        vant.Toast(`当前值：${value}, 当前索引：${index}`);
      },
      onChange(picker, value, index) {
        vant.Toast(`当前值：${value}, 当前索引：${index}`);
      },
      onCancel() {
        vant.Toast('取消');
      },
    }
  }
</script>