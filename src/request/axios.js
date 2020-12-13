/**
 * axios请求拦截器
 * 
 */

import axios from 'axios';
import qs from 'qs';
import { Loading, Message } from "element-ui";
import customMessage from "@/common/message"
import 'element-ui/lib/theme-chalk/index.css';
import Router from '@/router/index.js';
import util from '@/commonJs/util.js'
import api from '@/api/api.js'
import store from '@/vuex/store'
import constData from '@/commonJs/static/const';
let { systemHomeUrl } = constData;
const homeUrl = systemHomeUrl[store.state.systemName];
let loading, isShow = false;
let needLoadingRequestCount = 0;//声明一个对象用于存储请求个数
let targetType
let defaultConfig = {
  headers: {
    "Content-Type": "application/json"
  },
  timeout : 30000,
};
let HTTP = axios.create(defaultConfig);
let load = {
  startLoading() {
    // if (targetType != null) {
    //   loading = Loading.service({
    //     text: '拼命加载中...',
    //     target: targetType
    //   });
    // }
    loading = Loading.service({
      lock: true,
      text: 'Loading',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.7)'
    });
  },
  endLoading() {
    if (loading != undefined) {
      loading.close();
    }
  },
  showFullScreenLoading() {
    if (needLoadingRequestCount === 0) {
      this.startLoading();
    }
    needLoadingRequestCount++;
  },
  tryHideFullScreenLoading() {
    if (needLoadingRequestCount <= 0) {
      needLoadingRequestCount = 0
      return;
    }
    needLoadingRequestCount--;
    if (needLoadingRequestCount === 0) {
      this.endLoading();
    }
  }
};
//拦截器
HTTP.interceptors.request.use((config) => {
  //test();
  if (!config.cancelLoading) {
    load.showFullScreenLoading();
  }
  let token = sessionStorage.getItem("token");
  if (token) {
    config.headers.token = token;
  }
  return config;
}, (error) => { //404等问题可以在这里处理
  load.tryHideFullScreenLoading();
  return Promise.reject(error);
});
HTTP.interceptors.response.use((response) => { //返回状态判断
  let token = response.headers.newtoken;
  if(token){
    sessionStorage.setItem("token",token);
  }
  if (response.status == 200) {
    load.tryHideFullScreenLoading();
  }
  if (judgeRquest(response)) {
    let error = {
      code: 601,
      message: response.data.msg
    }
    return Promise.reject(error)
  }
  return response;
}, (error) => { //404等问题可以在这里处理

  load.tryHideFullScreenLoading();
  let tempArr = [];

  // error.response.data.message != undefined ? tempArr.push(error.response.data.message) : '';
  if (error.response.data.details != undefined) {
    Array.from(error.response.data.details, (result) => {
      if (result.field) {
        tempArr.push(result.field + " : " + result.message);
      } else {
        tempArr.push(result.message);
      }
    })
  }
  let message = error.response.data.message || "未知错误";

  if (error && error.response) {
    if (error.request.responseURL.indexOf(api.api.sessionInfo) != -1) {//对sessionInfo接口不做错误处理
      return Promise.reject(error)
    }
    switch (error.response.status) {
      case 400:
      //case 401:
      case 403:
      case 404:
      case 408:
        customMessage.warning({ message: message, duration: 2000, detailMessage: tempArr });
        break;
      case 500:
        customMessage.error({ message: message, duration: 2000 })
        break;
      case 501:
        Message.error({ message: '服务未实现501: ' + message, duration: 2000 })
        break
      case 502:
        Message.error({ message: '网关错误502: ' + message, duration: 2000 })
        break
      case 503:
        Message.error({ message: '服务不可用503: ' + message, duration: 2000 })
        break
      case 504:
        Message.error({ message: '网关超时504: ' + message, duration: 2000 })
        break
      case 505:
        Message.error({ message: 'HTTP版本不受支持505: ' + message, duration: 2000 })
        break
      case 401:
        Message.warning({ message: "登录超时，请重新登录", duration: 2000 });
        Router.push({ path: homeUrl });
        break;

      // case 601: //自定义错误码
      //   debugger;
      //   Message.error({ message: error.response.message, duration: 2000 });
      //   break;
      default:
        //console.log("出错",tempArr);
        customMessage.warning({ message: message, duration: 2000, detailMessage: tempArr });
        break;
    }
  }
  return Promise.reject(error);
})

function judgeRquest(response) {

  if (response.data.code && response.data.code != "0") {
    Message.error({ message: response.data.msg, duration: 2000 });
    return true;
  }

  if (response.data.returnCode == 0) {
    Message.error({ message: response.data.msg, duration: 2000 });
    return true;
  }

  return false;

}


export default {
  setTargetLoadType(content = '.el-main') {
    targetType = document.querySelector(content);
    return this;
  },
  setConfig(data = {}) {
    if (typeof data !== 'object') return data
    defaultConfig = data;
    HTTP = axios.create(defaultConfig);
    return this;
  },
  post(url, params = {}, config = {}, standardRule = {}) {
    if (!standardRule.needDeleteEmptyProperty) {
      params = util.deleteEmptyProperty(params);
      params = util.deleteEmptyProperty(params);
      params = util.changeObjectVale(params);
    }
    return new Promise((resolve, reject) => {
      HTTP.post(url, params, config)
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  postNullable(url, params = {}, config = {}, standardRule = {}) {
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      HTTP.post(url, params, config)
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  get(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      url = (url.indexOf("?") == '-1') ? `${url}?t=${+new Date().getTime().toString()}`
        : `${url}&t=${new Date().getTime().toString()}`
      HTTP.get(url, Object.assign({
        params: params,
        paramsSerializer: params => {
          return qs.stringify(params, { arrayFormat: 'indices', allowDots: true })
        }
      }, config)).then(response => {
        resolve(response);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },
  delete(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      url = (url.indexOf("?") == '-1') ? `${url}?t=${+new Date().getTime().toString()}`
        : `${url}&t=${new Date().getTime().toString()}`
      HTTP.delete(url, Object.assign({
        params: params,
        paramsSerializer: params => {
          return qs.stringify(params, { arrayFormat: 'indices', allowDots: true })
        }
      }, config)).then(response => {
        resolve(response);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },
  put(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      HTTP.put(url, params, config).then(response => {
        resolve(response);
      }, err => {
        reject(err);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },
  putNullable(url, params = {}, config = {}) {
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      HTTP.put(url, params, config).then(response => {
        resolve(response);
      }, err => {
        reject(err);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },

  putPeopleInfo(url, params = {}, config = {}) {
    debugger;
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    if(!params.phone){
      params.phone = "";
    }
    return new Promise((resolve, reject) => {
      HTTP.put(url, params, config).then(response => {
        resolve(response);
      }, err => {
        reject(err);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },
  patch(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    return new Promise((resolve, reject) => {
      HTTP.patch(url, params, config)
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  postForm(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    let urlParams = qs.stringify(params, { indices: false });
    return new Promise((resolve, reject) => {
      HTTP.post(url + "?" + urlParams, null, config)
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  postMultipartForm(url, params = {}, config = {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }) {

    //  let urlParams = qs.stringify(params, { indices: false });
    return new Promise((resolve, reject) => {
      HTTP.post(url, params, config)
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  deleteBody(url, params = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      HTTP.delete(url, { data: params })
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  deleteForm(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      url = (url.indexOf("?") == '-1') ? `${url}?t=${+new Date().getTime().toString()}`
        : `${url}&t=${new Date().getTime().toString()}`
      HTTP.delete(url, Object.assign({
        params: params,
        paramsSerializer: params => {
          return qs.stringify(params, { arrayFormat: 'repeat', allowDots: true })
        }
      }, config)).then(response => {
        resolve(response);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },
  getForm(url, params = {}, config = {}) {
    params = util.deleteEmptyProperty(params);
    params = util.deleteEmptyProperty(params);
    params = util.changeObjectVale(params);
    return new Promise((resolve, reject) => {
      url = (url.indexOf("?") == '-1') ? `${url}?t=${+new Date().getTime().toString()}`
        : `${url}&t=${new Date().getTime().toString()}`
      HTTP.get(url, Object.assign({
        params: params,
        paramsSerializer: params => {
          return qs.stringify(params, { arrayFormat: 'repeat', allowDots: true })
        }
      }, config)).then(response => {
        resolve(response);
      })
        .catch((error) => {
          reject(error)
        })
    })
  },
  postFormMethod(url, params = {}, config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  }) {
    let urlParams = qs.stringify(params, { indices: false });
    return new Promise((resolve, reject) => {
      HTTP.post(url, qs.stringify(params), config)
        .then(response => {
          resolve(response);
        }, err => {
          reject(err);
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  downLoadPromiseParams(url, params, fileName) {
    //异步二进制文件流下载
    let token = sessionStorage.getItem("token");
    return new Promise((resolve, reject) => {
      this.setInterceptor();
      axios({
        method: 'get',
        url: url,
        responseType: 'blob',
        params: params,
        paramsSerializer: params => {
          return qs.stringify(params, { arrayFormat: 'repeat', allowDots: true })
        },
        headers: {
          token
        }
      }).then(response => {
        let data = response.data;
        if (!data) {
          return
        }
        let href = window.URL.createObjectURL(new Blob([data]))
        let link = document.createElement('a')
        link.style.display = 'none'
        link.href = href;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        resolve(resolve);
      }).catch((err) => {
        if (err.config.responseType === 'blob') {
          const data = err.response.data;
          const reader = new FileReader();
          reader.onload = evt => {
            try {
              const resultObj = JSON.parse(evt.target.result);
              // resultOb是解码后的数据，然后再进行提示处理
              Message.error({ message: resultObj.message || "文件下载失败", duration: 2000 })
            } catch (error) { }
          };
          reader.readAsText(data);
        }
        reject(err);
      })
    })
  },
  downLoadPromise(url, fileName) {
    //异步二进制文件流下载
    let token = sessionStorage.getItem("token");
    return new Promise((resolve, reject) => {
      this.setInterceptor();
      axios({
        method: 'get',
        url: url,
        responseType: 'blob',
        headers: {
          token
        }
      }).then(response => {
        let data = response.data;
        if (!data) {
          return
        }
        let href = window.URL.createObjectURL(new Blob([data]))
        let link = document.createElement('a')
        link.style.display = 'none'
        link.href = href;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        resolve(resolve);
      }).catch((err) => {
        if (err.config.responseType === 'blob') {
          const data = err.response.data;
          const reader = new FileReader();
          reader.onload = evt => {
            try {
              const resultObj = JSON.parse(evt.target.result);
              // resultOb是解码后的数据，然后再进行提示处理
              Message.error({ message: resultObj.message || "文件下载失败", duration: 2000 })
            } catch (error) { }
          };
          reader.readAsText(data);
        }
        reject(err);
      })
    })
  },
  downLoad(url, fileName) {//二进制文件流下载
    let token = sessionStorage.getItem("token");
    // http响应拦截器
    this.setInterceptor();
    axios.interceptors.response.use(res => {
      if (res.data.bodyObj && res.data.bodyObj.code) {
        let code = res.data.bodyObj.code
        // 10101是未登录状态码
        if (code === 10101) { // 如果是未登录直接踢出去
          location.href = '/login.html'
        }
      }
      return res
    },
      error => {
        // alert('请求失败，请稍后重试！')
        return Promise.reject(error)
      }
    )
    axios({
      method: 'get',
      url: url,
      responseType: 'blob',

      headers: {
        token
      }
    }).then(response => {
      let data = response.data;
      if (!data) {
        return
      }
      let href = window.URL.createObjectURL(new Blob([data]))
      let link = document.createElement('a')
      link.style.display = 'none'
      link.href = href;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
    }).catch((error) => {

      Message.error({ message: "文件下载失败", duration: 2000 });
    })
  },
  downLoadPost(url, params = {}, fileName) {//二进制文件流下载
    let token = sessionStorage.getItem("token");
    this.setInterceptor();
    axios({
      method: 'post',
      url: url,
      responseType: 'blob',
      data: params,
      headers: {
        token
      }
    }).then(response => {
      let data = response.data;
      if (!data) {
        return
      }
      let href = window.URL.createObjectURL(new Blob([data]))
      let link = document.createElement('a')
      link.style.display = 'none'
      link.href = href;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
    }).catch((error) => {
      Message.error({ message: "文件下载失败", duration: 2000 });
    })
  },
  getAxios(option) {
    return axios;
  },
  setInterceptor() {
    axios.interceptors.request.use(
      config => {
        if (!config.cancelLoading) {
          load.showFullScreenLoading();
        }
        return config
      },
      error => {
        load.tryHideFullScreenLoading();
      }
    )
    axios.interceptors.response.use(res => {
      if (res.status == 200) {
        load.tryHideFullScreenLoading();
      }
      return res
    },
      error => {
        load.tryHideFullScreenLoading();
        return Promise.reject(error)
      }
    )
  },

  all(requests,callback){
    return new Promise((resolve, reject) => {
      axios.all(requests)
        .then(axios.spread(callback))
        .catch((error) => {
          reject(error)
        })
    })
  },
  isHide(show) {
    isShow = show;
    return this;
  }

}