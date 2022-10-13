example编译模块的传参属性

  * vuetify
    
    meta:{}  //参考 【vue-meta】 自定义设定引入客户端的资源文件，设定后将覆盖默认的cdn
    option:{} //初始化时的参数设置（如果有的话，请参考对应组件库的官网说明）

    支持option, 参考官网 new Vuetify(option)

  * vant
    
    meta:{}  //参考 【vue-meta】 自定义设定引入客户端的资源文件，设定后将覆盖默认的cdn
    option:{
      locale: 'en'   ,  //  默认中文不需要设置，其他支持语言参考官网说明
    }

  * elementui

    meta:{}  //参考 【vue-meta】 自定义设定引入客户端的资源文件，设定后将覆盖默认的cdn
    option:{
      locale: 'en'   ,  //  默认中文不需要设置，其他支持语言参考官网说明
    }