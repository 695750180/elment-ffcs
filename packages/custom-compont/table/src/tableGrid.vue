<template>
    <div>
        <div class="navTitle tableTitle" v-if="isShowTableNav">
            <div class="tableTitleLeft">
                <span class="iconfont icon-liebiaomoshi_kuai"></span>
                <span>数据列表</span>
            </div>
            <div class="tableTitleRight">
                <slot name="opt"></slot>
            </div>
        </div>
        <table-component :table-data="tableData" :table-option="tableOption" :page-data="pageData" v-loading="loading"
        :custom-label="customLabel" @page-change="pageChange" ref="tableComponent" @click-table="clickTable" @cell-dblclick="clickdbTable"
        @table-select-change ="tableSelectChange" @select="selectRow" :fixed="fixed" :height="height">
            <template slot="expand" slot-scope="scope">
                <slot name="expand" :row-data="scope.rowData"></slot>
            </template>
            <el-table-column type="index" :index="indexMethod" slot="index" label="序号"  width="55"
                             v-if="this.option.tableOption.isShowIndex">
            </el-table-column>
            <template slot-scope="scope">  <!-- 作用域插槽 自定义列使用作用域插槽实现-->
                <slot :row-data="scope.rowData"></slot>
            </template>
        </table-component>
    </div>
</template>
<script>
/**
 * option : { //表格配置项
        tableOption :{//表格配置项
         
          isReserveSelection : false//是否保存数据更新前选中的数据， 默认为false
          tableUnique : id //表格唯一标识字段  isReserveSelection为true时，必须填
          expandable : 是否可展开
          align : 'center/left/right'//对齐方式，默认为居中
          singleSelect : false // 是否支持单选，默认为false
          isShowSelect ：true,  //是否显示多选列   默认值为false
          hasCustomColum : true, // 是否自定义列   默认值为false
          opeColumnWidth : "200",//自定义列的宽度
          isShowIndex: false, // 是否显示序号列   默认值为false
          hasDrillDownCell: false,//是否有下钻 默认值为false
          drillDownProp : {//下钻参数配置(若hasDrillDownCell为true时，此项配置必填)
            unique : 'codeId', //指定一个一行的唯一标识
            drillDownFlag : 'tag' //指定一个判断该行是否具备下钻参数
            url : '', // 下钻请求地址,（必填）
            param : {},//下钻参数
            requestArg: '',//异步请求参数指定，默认为unique的字段。
            drillDownColumn : '',//指定下钻列触发点击事件，若不指定，一行点击都能触发下钻
          },
          prop:{
              data : 'data',//响应数据取值对应字段，默认为data字段 
              totalcount : 'totalcount' //总记录数取值字段配置，默认为totalcount字段
              page : 'page' //当前页数请求参数配置，默认为page
          },
          tableTitle : [{ // 表格标题，prop的值要与tableData中的属性值一一对应，否则无法渲染表格
                prop : "sortnumber", //列加载字段名，必填
                label : "排序号" // 列名指定，必填
                width : "180",//列宽度指定
                drillDown :  false, //是否具备下钻,默认为不下钻（若有下钻，必须配置hasDrillDownCell为true才生效）
                format: function(row, column, cellValue, index){}//自定义列内容
            }],
           tableBodyOverFlow : true, //是否设置表格body体滚动
           load:function(tree, treeNode, resolve) // 异步加载树表格 表格数据需要有hasChildren为true时生效
 *       },
        height : String/number, //非必填,表格高度，若超过该高度则滚动body体，表头固定
 *      customLabel ： '操作', //自定义列标题,hasCustomColum为true时有效
 *      fixed : "right/left", //非必填，自定义列固定位置,若不固定不填或者配置为false
 *      type : 'get', //请求方式，post、get、getForm  默认为get请求（get和getForm为数组传参方式的不同）
 *      param ： {}, //请求参数, 必填 必需属性:每页显示几条pageSize, 当前页pageNum
 *      baseParam: {},//组件发生数据请求时默认携带参数，非必填
 *      url : '', //获取数据接口，必填
 *      isShowPage ： true //是否需要分页，默认为true
 *      notRequestSever//第一次加载是否默认查询
 *      showTableNav : true, //是否显示表格头部，默认为true
 *      showTitle : true,//是否支持鼠标移动上去悬浮提示内容,默认为true
 *      filter:function, //过滤回调函数
 *
 * }
 *
 * 事件：
 *     click-table : 表格点击事件，回调函数返回 row, column, cell, event
 *     table-select-change ： 表格复选框发生改变事件 回调函数返回 selection
 * 
 * 
 * 插槽：
 *      opt : 头部按钮
 *      默认 : 表格列表操作列
 * 
 *
 * 注意：
 *    父组件在使用插槽自定列的时候，需要获取数据请使用属性  slot-scope = "row"
 *此变量会将行的数据封装json返回  格式为 rowData ：{}。若表格不需要分页，pageData不需要传递即可。
 *
 * API:
 *     clearSelection() : 清楚所有选中复选框
 *     setCurrentRow(row) : 选中某一个表格，singleSelect为true时有效
 *     setRowSelections(rows) ： 选中复选框
 *     setRowSelectionsById(ids): 通过id数组选中复选框
 *     getSelectedRow() : 获取所有选中的行
 *     getCurrentRow() : 获取表格选中某一行的数据，singleSelect为true时有效
 *     flushTableData() : 刷新表格数据
 *     searchTableData() : 表格数据搜索
 *     flushTableDataTthisPage() : 刷新表格数据并留在当前页
 *
 *
 */
import util from "@/utils/myUtil"
import tableComponent from './tableComponent'
export default {
    name : 'tableGrid', 
    props : ['option'],
    data : function(){
        return {
            multipleSelection : [],
            isShowTableNav : this.option.showTableNav == false ? this.option.showTableNav : true,
            tableData : [],
            pageData : {
                pageSize : this.option.param.size || this.option.baseParam.size,
                isShowPage : this.option.isShowPage == false ? this.option.param.isShowPage : true,
                total : 0
            },
            customLabel : this.option.customLabel,
            fixed : this.option.fixed || false,
            height : this.option.height < 1 ?  "-webkit-fill-available" : this.option.height,
            tableOption : this.option.tableOption,
            hasDrillDownCell : this.option.tableOption.hasDrillDownCell ? true : false,
            drillDownProp : this.option.tableOption.drillDownProp,
            type : this.option.type ? this.option.type : 'get',
            url : this.option.url,
            param : this.option.param,
            baseParam : this.option.baseParam || {},
            loading: false,
            reqVersion: 0,
            notRequestSever : this.option.notRequestSever,
            tableTreeData : [],
            showTitle : this.option.showTitle == false ? false : true,
            prop:{
                data : this.option.tableOption.prop ? this.option.tableOption.prop.data : 'data',
                totalcount : this.option.tableOption.prop ? this.option.tableOption.prop.totalcount : 'totalcount',
                page : this.option.tableOption.prop ? this.option.tableOption.prop.page : 'page'
            }
        }
    },

    created : function(){
        if(this.showTitle){
            this.titleDeal();
        }
        if(this.hasDrillDownCell){//是否配置下钻
            this.loopProp();
        }
        if(!this.notRequestSever){
            this.getTableData();
        }
    },

    mounted : function() {
        
    },

    methods : {
        titleDeal(){//表格鼠标悬浮提示
            let vm = this;
            let props = this.tableOption.tableTitle;
            
            for(let i = 0 ; i < props.length ; i++){
                if(props[i].format){
                    continue;
                }else{
                    props[i].format = function(row, column, cellValue, index){
                        let content = util.readObjectKey(row,props[i].prop); 
                        return <div title={content}>{content}</div>;
                    }
                }
            }
        }, 
        loopProp : function(){//表格下钻处理
            var vm = this;
            var props = this.tableOption.tableTitle;
            for(let i = 0 ; i < props.length ; i++){
                if(props[i].drillDown){
                    props[i].format = vm.propFormat;
                }
            }
        },
        getTableData : function(){
            var _this = this;
            let param = {};
            Object.assign(param,_this.baseParam,_this.param);
            let _request = _this.$http.get;
            if (_this.type === 'post') {
                _request = _this.$http.post;
            }else if(_this.type == 'postForm'){
                _request = _this.$http.postForm;
            }else if(_this.type == 'getForm'){
                _request = _this.$http.getForm;
            }
            _this.loading = true;
            _this.reqVersion ++;
            let version = _this.reqVersion;
            _this.tableData = [];
            let promise = new Promise((reslove,reject)=>{
                _request(_this.url, param).then(function(response){
                    if(version !== _this.reqVersion) {
                        return;
                    }
                    if(_this.pageData.isShowPage){
                        let data = util.readObjectKey(response.data,_this.prop.data); 
                        let total = util.readObjectKey(response.data,_this.prop.totalcount);
                        // 增加过滤
                        if (_this.option.filter) {
                            _this.tableData = _this.option.filter(data || []);
                        } else {
                            _this.tableData = data || [];
                        }
                        // _this.tableData = data || [];
                        _this.pageData.total = total;
                        //_this.tableData = response.data[_this.prop.data] || [];
                       // _this.pageData.total = response.data[_this.prop.totalcount] || 0;
                    }else{
                        //let data = util.readObjectKey(response.data,_this.prop.data); 
                        let data = response.data;
                        // 增加过滤
                        if (_this.option.filter) {
                            _this.tableData = _this.option.filter(data || []);
                        } else {
                            _this.tableData = data || [];
                        }
                        //_this.tableData = response.data[_this.prop.data] || [];
                        // _this.tableData = data || [];
                        _this.pageData.total = 0;
                    }
                    _this.$emit("finishRequest",response);
                    reslove(response);
                }).catch(function(e){
                    if(version !== _this.reqVersion) {
                      return;
                    }
                    _this.tableData = [];
                    _this.pageData.total = 0;
                    console.log(e);
                    reject(e);
                }).then(() => { // 这里无论如何都会执行  除非catch抛异常
                    _this.loading = false;
                    _this.tableTreeData = _this.tableData;
                })
            });
            return promise;
        },

        pageChange : function(pageIndex){
            //this.param.pageNum = pageIndex;
            if(this.pageData.isShowPage){
                this.param[this.prop.page] = pageIndex;//后期需要做个适配
            }
            let pagePromise =  this.getTableData();
            this.$emit("page-change",pagePromise);
            return pagePromise;
        },

        clickTable : function(row, column, cell, event){
            if(this.hasDrillDownCell){//是否有下钻选项
                if(this.drillDownProp.drillDownColumn && column.property != this.drillDownProp.drillDownColumn){
                    this.$emit("click-table", row, column, cell, event);
                    return;
                }
                if(row[this.drillDownProp.drillDownFlag]){
                    if(row.open){//收起数据
                        row.open = false;
                        for(let i = 0 ; i < this.tableTreeData.length ; i++){
                            if(row[this.drillDownProp.unique] == this.tableTreeData[i][this.drillDownProp.unique]){
                                this.tableTreeData[i].children = null;
                                break;
                            }
                        }
                        var tableList = [];
                        this.changeTreeToList(this.tableTreeData,tableList);
                        this.tableData = tableList;

                    }else{//下钻数据
                        row.open = true;
                        let arg = this.drillDownProp.requestArg;
                        let unique = this.drillDownProp.unique;
                        if(arg){//是否需要自定义入参参数
                            this.drillDownProp.param[arg] = row[unique];
                        }else{
                            this.drillDownProp.param[unique] = row[unique];
                        }
                        this.addTableData(row);
                    }
                }
            }
            this.$emit("click-table", row, column, cell, event);
        },
        clickdbTable:function(row, column, cell, event){
          this.$emit("cell-dblclick", row, column, cell, event);

        },
        addTableData : function(row){
            let vm = this;
            let _request = vm.$http.get;
            if (vm.type === 'post') {
                _request = vm.$http.post;
            }
            _request(vm.drillDownProp.url,vm.drillDownProp.param).then(function(response){
                for(let i = 0; i<vm.tableTreeData.length; i++){
                    if(row[vm.drillDownProp.unique] == vm.tableTreeData[i][vm.drillDownProp.unique]){
                        vm.tableTreeData[i].children = response.data.data;
                        break;
                    }
                }
                var tableList = [];
                vm.changeTreeToList(vm.tableTreeData,tableList);
                vm.tableData = tableList;
            });
        },

        //解析表格下钻数据
        changeTreeToList(tableTree,tableList){
            for(var i = 0; i < tableTree.length; i++){
                tableList.push( tableTree[i]);
                if(tableTree[i].children){
                    this.changeTreeToList(tableTree[i].children,tableList);
                    tableTree[i].children = null;
                }
            }
        },

        //获取表格下钻数据
        getDrillDownData : function(){

        },

        //复选框改变事件
        tableSelectChange : function(selection){
            this.$emit("table-select-change",selection);
        },

        //复选框点击事件
        selectRow : function(selection, row){
            this.$emit("table-select",selection, row);
        },

        clearSelection : function(){
            this.$refs.tableComponent.clearSelection();
        },

        //设置表格某一行选中
        setCurrentRow : function(row){
            this.$refs.tableComponent.setCurrentRow(row);
        },

        //设置默认选中的复选框
        setRowSelections : function(remenmberSelectRows){
            this.$refs.tableComponent.setRowSelections(remenmberSelectRows || []);
        },

        //通过id设置默认选中的复选框
        setRowSelectionsById : function(ids =[]){
            
            let rows = [];
            for(let i = 0 ; i < ids.length; i++){
                for(let j = 0 ; j < this.tableData.length; j++){
                    if(ids[i] == this.tableData[j].id){
                        rows.push(util.copyObject(this.tableData[j]));
                        break;
                    }
                }
            }
            this.setRowSelections(rows);
        },

        //获取选中表格某一行的值
        getCurrentRow(){
            return this.$refs.tableComponent.getCurrentRow();
        },

        //获取已选中的数据
        getSelectedRow : function(){
            return this.$refs.tableComponent.getSelectedRow();
        },

        flushTableData : function(){
            this.$refs.tableComponent.changeCurrentPage(1);
            return this.pageChange(1);
            
        },

        flushTableDataTthisPage : function(){
            //this.$refs.tableComponent.changeCurrentPage();
            return this.getTableData();
        },

        searchTableData : function(param){
            this.param = param;
            return this.flushTableData();
        },

        // 计算序号列序号
        indexMethod(index) {
            const vm = this;
            let {param, pageData} = vm;
            if (!pageData.isShowPage) {
              return index;
            }
            let pageNum = Number.parseInt(param.pageNum);
            pageNum = pageNum > 0 ? pageNum : 1;
            let pageSize = Number.parseInt(pageData.pageSize);
            pageSize = pageSize > 0 ? pageSize : 10;
            return (pageNum - 1) * pageSize + index + 1;
        },

        //表头格式化，针对于有下钻的配置的表格配置
        propFormat (row, column, cellValue, index){
            var vm = this;
            if(row[vm.drillDownProp.drillDownFlag]){//是否需要下钻,通过外部回调判断
                if(row.open){
                    return <div class="drillDownColumn"><i class="el-icon el-icon-minus" ></i>{cellValue}</div>;
                }else{
                    return <div class="drillDownColumn"><i class="el-icon el-icon-plus" ></i>{cellValue}</div>;
                }
            }else{
                return cellValue;
            }

        },


        //点击某一单元格
        /* clickEspecialCell : function(row, column, cell, event){
            this.$emit("click-especial-cell", row, column, cell, event);
        }, */
    },

    components : {
        'table-component' : tableComponent
    },

    watch: {
        'option.url'() {
            this.url = this.option.url ? this.option.url : ''
        },
        'option.tableOption.drillDownProp'() {
            this.drillDownProp = this.option.tableOption.drillDownProp;
        },
        'option.tableOption.drillDownProp.param'() {
            this.drillDownProp = this.option.tableOption.drillDownProp;
        },
        'option.tableOption.isShowSelect'() {
            this.tableOption.isShowSelect = this.option.tableOption.isShowSelect
        }

    }




}
</script>
<style scoped>
.tableTitle{
    border: 1px solid #ccc;
    height: 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
}
.drillDownColumn{
    cursor: pointer;
}
.tableTitleLeft{
    margin-left: 17px;
}
.tableTitleRight{
    margin-right: 10px;
}
</style>
