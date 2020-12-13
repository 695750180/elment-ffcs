import tableGride from './tableGride';

/* istanbul ignore next */
tableGride.install = function(Vue) {
  Vue.component(tableGride.name, tableGride);
};

export default tableGride;