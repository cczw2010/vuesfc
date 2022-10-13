<style scoped lang="less">

</style>
<template>
  <div>
      <div class="example">
        <a-pagination :default-current="1" :total="50" show-size-changer />
      </div>
      <div class="example">
        <a-button type="primary" @click="visible = true">
          Show Modal
        </a-button>
        <a-button @click="info">
          Show info
        </a-button>
        <a-button @click="confirm">
          Show confirm
        </a-button>
        <a-popconfirm title="Question?">
          <a href="#">Click to confirm</a>
        </a-popconfirm>
      </div>
      <div class="example">
        <a-transfer
          :data-source="[]"
          show-search
          :target-keys="[]"
          :render="item => item.title"
        />
      </div>
      <div class="example">
        <a-table :data-source="[]" :columns="columns" />
      </div>
      <a-modal v-model="visible" title="Locale Modal">
        <p>Locale Modal</p>
      </a-modal>
  </div>
</template>
<script type="text/javascript">
  import './home.less';
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      filters: [
        {
          text: 'filter1',
          value: 'filter1',
        },
      ],
    },
    {
      title: 'Age',
      dataIndex: 'age',
    },
  ];
  export default {
    head(){
      return {
        title:this.title
      }
    },
    data(){
      return {
        title:"ant design vue demo",
        columns,
        visible: false
      }
    },
    // components:[],
    methods:{
      info() {
        this.$info({
          title: 'some info',
          content: 'some info',
        });
      },
      confirm() {
        this.$confirm({
          title: 'some info',
          content: 'some info',
        });
      },
    },
    onCreated(){
      // moment.locale('zh-cn');
    }
  }
</script>