<style scoped>
  .home{
    color:brown
  }
</style>

<template>
  <div class="home">
    <h1>{{title}}</h1>
      <el-button type="text" @click="open">点击打开 Message Box</el-button>
      <el-select v-model="value" >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
  </div>
</template>
<script type="text/javascript">
  export default {
    asyncData(data){
      return {
        title : data.title
      }
    },
    data(){
      return {
        options: [{
          value: '选项1',
          label: 'V1加工制作'
        },{
          value: '选项5',
          label: '北京烤鸭'
        }],
        value: ''
      }
    },
    head(){
      return {
        title:this.title,
      }
    },
    layout:'default',
    methods:{
     open() {
        this.$alert('这是一段内容', '标题名称', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${ action }`
            });
          }
        });
      }
    }
  }
</script>