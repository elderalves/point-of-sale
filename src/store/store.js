import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    productsOnCart: 3
  },
  mutations: {
    increment (state) {
      state.productsOnCart++
    }
  }
});

export default store;
