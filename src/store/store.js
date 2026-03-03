import Vue from 'vue';
import Vuex from 'vuex';
import ProductData from './../data/products.json';

Vue.use(Vuex)

const categoryColors = {
  Cards: '#f39c12',
  Snacks: '#e67e22',
  Pizza: '#c0392b',
  Parties: '#9b59b6',
  Attractions: '#16a085',
  Merchandise: '#2980b9'
};

function getCategory (name) {
  if (name.includes('Pizza')) {
    return 'Pizza';
  }

  if (name.includes('Cake') || name.includes('Cookies') || name.includes('Candy') || name.includes('Candles')) {
    return 'Parties';
  }

  if (name.includes('Bounce') || name.includes('Laser')) {
    return 'Attractions';
  }

  if (name.includes('Card')) {
    return 'Cards';
  }

  if (name.includes('Snacks')) {
    return 'Snacks';
  }

  return 'Merchandise';
}

function normalizeProducts () {
  return ProductData.map((product) => {
    const category = getCategory(product.name);

    return {
      ...product,
      price: Number(product.price),
      category,
      color: categoryColors[category] || categoryColors.Merchandise
    };
  });
}

function clearCartState (state) {
  state.cart = {};
  state.cartSequence = [];
  state.paidAmount = 0;
  state.orderStatus = 'OPEN';
}

function resetPaymentState (state) {
  state.paidAmount = 0;
  state.orderStatus = 'OPEN';
}

export default new Vuex.Store({
  state: {
    products: normalizeProducts(),
    cart: {},
    cartSequence: [],
    activeCategory: 'All',
    customers: [
      'Walk-in Guest',
      'Birthday Party',
      'School Group',
      'VIP Member'
    ],
    currentCustomerIndex: 0,
    orderNumber: 23934,
    orderStatus: 'OPEN',
    paidAmount: 0
  },
  getters: {
    categories (state) {
      const uniqueCategories = state.products
        .map((product) => product.category)
        .filter((category, index, categories) => categories.indexOf(category) === index);

      return ['All'].concat(uniqueCategories);
    },
    selectedCustomer (state) {
      return state.customers[state.currentCustomerIndex];
    },
    filteredProducts (state) {
      if (state.activeCategory === 'All') {
        return state.products;
      }

      return state.products.filter((product) => product.category === state.activeCategory);
    },
    cartItems (state) {
      return state.products
        .filter((product) => state.cart[product.id])
        .map((product) => ({
          ...product,
          quantity: state.cart[product.id],
          lineTotal: state.cart[product.id] * product.price
        }));
    },
    cartQuantity: (state) => (productId) => {
      return state.cart[productId] || 0;
    },
    itemCount (state) {
      return Object.keys(state.cart).reduce((total, productId) => total + state.cart[productId], 0);
    },
    subtotal (state, getters) {
      return getters.cartItems.reduce((total, product) => total + product.lineTotal, 0);
    },
    smallTax (state, getters) {
      return getters.subtotal * 0.01;
    },
    largeTax (state, getters) {
      return getters.subtotal * 0.10;
    },
    serviceFee (state, getters) {
      return getters.subtotal > 0 ? 2.5 : 0;
    },
    total (state, getters) {
      return getters.subtotal + getters.smallTax + getters.largeTax + getters.serviceFee;
    },
    balanceDue (state, getters) {
      return Math.max(getters.total - state.paidAmount, 0);
    },
    isPaid (state, getters) {
      return getters.total > 0 && state.paidAmount >= getters.total;
    }
  },
  mutations: {
    SET_ACTIVE_CATEGORY (state, category) {
      state.activeCategory = category;
    },
    ADD_TO_CART (state, productId) {
      const quantity = state.cart[productId] || 0;

      Vue.set(state.cart, productId, quantity + 1);
      state.cartSequence.push(productId);
      resetPaymentState(state);
    },
    REMOVE_FROM_CART (state, productId) {
      const quantity = state.cart[productId];

      if (!quantity) {
        return;
      }

      if (quantity === 1) {
        Vue.delete(state.cart, productId);
      } else {
        Vue.set(state.cart, productId, quantity - 1);
      }

      const lastIndex = state.cartSequence.lastIndexOf(productId);

      if (lastIndex !== -1) {
        state.cartSequence.splice(lastIndex, 1);
      }

      resetPaymentState(state);
    },
    CLEAR_PRODUCT (state, productId) {
      if (!state.cart[productId]) {
        return;
      }

      Vue.delete(state.cart, productId);
      state.cartSequence = state.cartSequence.filter((cartProductId) => cartProductId !== productId);
      resetPaymentState(state);
    },
    CLEAR_CART (state) {
      clearCartState(state);
    },
    REMOVE_LAST_ITEM (state) {
      const lastProductId = state.cartSequence.pop();

      if (!lastProductId) {
        return;
      }

      const quantity = state.cart[lastProductId];

      if (quantity === 1) {
        Vue.delete(state.cart, lastProductId);
      } else {
        Vue.set(state.cart, lastProductId, quantity - 1);
      }

      resetPaymentState(state);
    },
    CYCLE_CUSTOMER (state) {
      state.currentCustomerIndex = (state.currentCustomerIndex + 1) % state.customers.length;
    },
    CANCEL_ORDER (state) {
      state.orderNumber += 1;
      clearCartState(state);
    },
    PAY_ORDER (state, total) {
      state.paidAmount = total;
      state.orderStatus = 'PAID';
    }
  },
  actions: {
    setActiveCategory ({ commit }, category) {
      commit('SET_ACTIVE_CATEGORY', category);
    },
    addProduct ({ commit }, productId) {
      commit('ADD_TO_CART', productId);
    },
    removeProduct ({ commit }, productId) {
      commit('REMOVE_FROM_CART', productId);
    },
    clearProduct ({ commit }, productId) {
      commit('CLEAR_PRODUCT', productId);
    },
    clearCart ({ commit }) {
      commit('CLEAR_CART');
    },
    removeLastItem ({ commit }) {
      commit('REMOVE_LAST_ITEM');
    },
    cycleCustomer ({ commit }) {
      commit('CYCLE_CUSTOMER');
    },
    cancelOrder ({ commit }) {
      commit('CANCEL_ORDER');
    },
    payOrder ({ commit, getters }) {
      if (getters.total <= 0) {
        return;
      }

      commit('PAY_ORDER', getters.total);
    }
  }
});
