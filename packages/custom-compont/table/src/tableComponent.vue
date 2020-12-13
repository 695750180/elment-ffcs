<template>
    <div>
        <el-table :data="tableData"  style="width: 100%" @cell-click="clickTable" @cell-dblclick="clickdbTable" @selection-change="selectionChange" :highlight-current-row="tableOption.singleSelect || false"
        @expand-change="expandChange" ref="mytable"  class="table-grid" :row-class-name="tableRowClassName" border @select="selectRow" :row-key="handleReserve" @current-change="currentChange" :height="height"
        :load="load" :tree-props="{children: 'children', hasChildren: 'hasChildren'}" lazy>
          <el-table-column type="expand" v-if="tableOption.expandable"> 
            <template slot-scope="scope">
              <slot name="expand" :row-data="scope.row"></slot>
            </template>
          </el-table-column>
          <el-table-column type="selection" width="55" :reserve-selection="isReserveSelection" v-if="tableOption.isShowSelect ? tableOption.isShowSelect : false"></el-table-column>
          <slot name="index"></slot>
          <el-table-column v-for="(item,index) in tableOption.tableTitle" :fixed="item.fixed" :prop="item.prop" :align="tableOption.align? tableOption.align : 'center'" :formatter="item.format" :label="item.label" :width ="item.width ? item.width : ''" :show-overflow-tooltip="item.showOverflowTooltip" :key="index">
                 <!-- <template slot-scope="scope" >
                    <span class="clickable" type="text" size="small" v-if="item.ifClickable" @click="clickEspecialCell(scope.row)" >{{scope.row[item.prop]}}</span>
                    <span type="text" size="small" v-else>{{scope.row[item.prop]}}</span>
                </template>  -->
          </el-table-column>
          <el-table-column :align="tableOption.align? tableOption.align : 'center'" :width="opeColumnWidth" :label="customLabel ? customLabel : ''" v-if="tableOption.hasCustomColum ? tableOption.hasCustomColum : false" :fixed="fixed">
            <template slot-scope="scope">
              <slot :row-data="scope.row"></slot>
            </template>
          </el-table-column>
        </el-table>

        <div class="tableGridPage"  v-if="pageData.isShowPage ? true : false ">
            <div class='pageInfo'> 
                <div>共<span class='numberColor'>{{pageData.total}}</span> 条</div>
                <div>{{`每页 ${pageData.pageSize ? pageData.pageSize : 10} 条`}}</div> 
            </div>
            <div class='pagePation'>  
                <el-pagination  layout=" prev, pager, next, jumper" :total="pageData.total ? pageData.total : 0 " :current-page.sync="currentPage"
                @current-change="changePage" background :page-size="pageData.pageSize ? pageData.pageSize : 10" class="narmalPage" v-if="pageData.isShowPage ? true : false " ></el-pagination><!-- sizes ,  :page-sizes="[10]" -->
            </div>
        </div>

        <!-- <el-pagination prev-text="上一页" next-text="下一页" layout="total , prev, pager, next" :total="pageData.total ? pageData.total : 0 " :current-page.sync="currentPage"
               @current-change="changePage"  :page-size="pageData.pageSize ? pageData.pageSize : 10" class="narmalPage" v-if="pageData.isShowPage ? true : false " ></el-pagination> -->
               <!-- sizes ,  :page-sizes="[10]" -->
    </div>

</template>

<script>
/**
 * tableData :  [{ // 表格组件数据
        sortnumber: '1',
        court: '福州市',
        departmentname: '福州市'

      },{
        sortnumber: '1',
        court: '福州市',
        departmentname: '福州市'

      }],
 *
 * tableOption :{//表格配置项
 *      opeColumnWidth : 200,//操作栏宽度
 *      isShowSelect ：true,  //是否显示多选列   默认值为false
 *      hasCustomColum : true, // 是否自定义列   默认值为false
 *      expandable : false // 是否可展开
 *      align : 'center/left/right'//对齐方式，默认为居中
 *      singleSelect : 是否支持单选
 *      tableTitle : [{ // 表格标题，prop的值要与tableData中的属性值一一对应，否则无法渲染表格
              prop : "sortnumber", //列加载字段名
              label : "排序号" // 列名指定
              width : "180",//列宽度指定
              ifClickable : true,//本列单元格是否可点击，默认为false[暂无用后期可能删除]
              fixed : true//列是否固定在左侧或者右侧，可选值为true, left, right，true 表示固定在左侧,默认为false,
          }],
        tableBodyOverFlow : true // 是否设置table的body滚动
        isReserveSelection : false//是否保存数据更新前选中的数据， 默认为false
        tableUnique ： "id"//表格唯一标识  isReserveSelection为true时必填
        load:function(tree, treeNode, resolve) // 异步加载树表格 表格数据需要有hasChildren为true时生效
 * }
 *
 * customLabel : 自定义列名字
 * fixed : "right/left" //非必填，自定义列固定位置,若不固定不填或者配置为false
 *
 * 注意：
 *    父组件在使用插槽自定列的时候，需要获取数据请使用属性  slot-scope = "row"
 *此变量会将行的数据封装json返回  格式为 rowData ：{}
 *
 *
 *
 * pageData : { // 分页组件
     total  : 100, //总记录
     pageSize ：10 //每页记录
     isShowPage : true //是否显示分页，默认为不显示
 * }
 *
 *
 * 事件：
 *     page-change : 分页页数改变事件，回调函数会有一个改变后页数的值 ：pageIndex
 *     click-table : 表格点击事件，回调函数返回 row, column, cell, event
 *     table-select-change ： 表格复选框发生改变事件 回调函数返回 selection
 *
 * API:
 *     clearSelection() : 清楚所有选中复选框
 *     setCurrentRow(row) : 选中表格某一条记录，singleSelect为true时有效
 *     getSelectedRow() : 获取所有选中的行
 *     setRowSelections(rows) : 选中复选框
 *     changeCurrentPage(pageInddex) : 修改分页组件当前页码的值
 *     clickEspecialCell(row, column, cell, event) : 点击某一个单元格[暂无用,后期可能删除]
 *     getCurrentRow() : 获取表格选中的某一行值，singleSelect为true时有效
 *
 *
 *
 *
 */
export default {
    props : ['tableData','tableOption','customLabel','pageData',"fixed","height"],
    name : 'tableComponent',
    data : function(){
        return {
            multipleSelection: [],
            currentRow:{},
            currentPage : 1,
            fixedHeight : this.tableOption.fixedHeight ? this.tableOption.fixedHeight : 250,
            opeColumnWidth : this.tableOption.opeColumnWidth ? this.tableOption.opeColumnWidth : 150,
            isReserveSelection : this.tableOption.isReserveSelection == true ?  this.tableOption.isReserveSelection : false,
            tableUnique : this.tableOption.tableUnique ? this.tableOption.tableUnique : "id",
            remenmberSelectRows : this.tableOption.remenmberSelectRows || [], //记录选中记录
        }
    },

    mounted : function(){
        //console.log(this.tableOption);

        if(this.tableOption.tableBodyOverFlow){
            this.getWindowHeight();
            this.setCurrentRow(currentRow);//选中一行记录
            this.setRowSelections(remenmberSelectRows);//复选框选中
        }
        this.setRowSelections(this.remenmberSelectRows);

    },

    methods : {
        setRowSelections(remenmberSelectRows){
            for(let i = 0 ; i < remenmberSelectRows.length ; i++){
                this.setToggleRowSelection(remenmberSelectRows[i],true);
            }
        },
        changePage : function(pageIndex){
            var tableBody = document.getElementsByClassName("el-table__body-wrapper");
            tableBody[0].scrollTop = 0; //重置滚动条到顶部
            this.$emit("page-change",pageIndex);
        },
        clickTable : function(row, column, cell, event){
            this.$emit("click-table", row, column, cell, event);
        },
        clickdbTable:function(row, column, cell, event){
          this.$emit("cell-dblclick", row, column, cell, event);
        },
        selectionChange : function(selection){
            this.multipleSelection = JSON.parse(JSON.stringify(selection));
            this.$emit("table-select-change",selection);
        },
        expandChange: function(row, expandedRows){
            var vm = this;
            var option = vm.tableOption;
            if(option && 'function' === typeof option['expandCallback']){
              option['expandCallback'](row, expandedRows);
            }
        },
        clearSelection : function(){
            this.$refs.mytable.clearSelection();
        },
        setCurrentRow : function(row){
            this.$refs.mytable.setCurrentRow(row); 
        },
        setToggleRowSelection : function(row,isSelected){
            this.$refs.mytable.toggleRowSelection(row,isSelected);
        },
        getSelectedRow : function(){
            return JSON.parse(JSON.stringify(this.multipleSelection));
        },
        getCurrentRow(){
            return JSON.parse(JSON.stringify(this.currentRow));
        },
        currentChange(currentRow,oldCurrentRow){
            this.currentRow = currentRow;
        },
        changeCurrentPage : function(page){
            this.currentPage = page;
        },
        getWindowHeight(){
            var bodyHeight = window.innerHeight;
            var tableBodyHeight = bodyHeight - this.fixedHeight;
            var tableBody = document.getElementsByClassName("el-table__body-wrapper");
            tableBody[0].style.height = tableBodyHeight+'px';
        },

        tableRowClassName({row, rowIndex}) {
            if (rowIndex % 2 === 0) {
                return '';
            } else {
                return 'customColor';
            }

        },

        selectRow (selection, row){
            this.$emit("select", selection, row);
        } ,

        handleReserve(row){
            return row[this.tableUnique];
        },
        
        load(tree, treeNode, resolve){
            if(this.tableOption.load){
                this.tableOption.load(tree, treeNode, resolve);
            }else{
                console.log("未配置异步加载回调函数,请配置值tableOption的load属性");
            }
        }
        //点击某一单元格[暂无用后期可能删除]
        /* clickEspecialCell : function(row, column, cell, event){
            this.$emit("click-especial-cell", row, column, cell, event);
        }, */
    },

    computed : {
        screenChage : function(){
            return document.body.clientHeight;
        }
    },
    watch : {
        screenChage : function(){
            this.getWindowHeight();
        }
    }

}
</script>

<style scoped>
.table-grid{
    overflow: auto;
    /* min-height: 60vh; */
}
.clickable{
    color: #289fff;
    cursor: pointer;
}
.narmalPage{
    text-align: center;
}
.pageInfo{
    color:#fff;
}

</style>

