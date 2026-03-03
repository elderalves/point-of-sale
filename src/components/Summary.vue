<template>
  <div class="summary">
    <h3 class="summary__order">
      ORDER #{{ orderNumber }}
      <span class="summary__badge">{{ orderStatusLabel }}</span>
    </h3>
    <div class="summary__section">
      <div class="summary__section-title">
        <h4>Items</h4>
        <p>{{ formatCurrency(subtotal) }}</p>
      </div>
      <div class="summary__products">
        <p v-if="!cartItems.length" class="summary__empty">
          Start adding items from the mock catalog to build this order.
        </p>
        <ul v-else>
          <li
            v-for="item in cartItems"
            :key="item.id"
            class="summary__product-item"
          >
            <button
              class="summary__product-delete"
              @click="clearProduct(item.id)"
            >
              X
            </button>
            <h4 class="summary__product-title">{{ item.name }}</h4>
            <p class="summary__product-info">
              {{ item.quantity }} Qty - {{ formatCurrency(item.lineTotal) }}
            </p>
          </li>
        </ul>
      </div>
    </div>
    <div class="summary__section">
      <div class="summary__section-title">
        <h4>Invoice</h4>
      </div>
      <div class="summary__invoice">
        <ul>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">Subtotal</h4>
            <p class="summary__invoice-value">{{ formatCurrency(subtotal) }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">1% Tax:</h4>
            <p class="summary__invoice-value">{{ formatCurrency(smallTax) }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">10% Tax:</h4>
            <p class="summary__invoice-value">{{ formatCurrency(largeTax) }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">Service Fee:</h4>
            <p class="summary__invoice-value">{{ formatCurrency(serviceFee) }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">Items in Cart:</h4>
            <p class="summary__invoice-value">{{ itemCount }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">Order Total:</h4>
            <p class="summary__invoice-value">{{ formatCurrency(total) }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">Payments:</h4>
            <p class="summary__invoice-value">{{ formatCurrency(paidAmount) }}</p>
          </li>
          <li class="summary__invoice-item">
            <h4 class="summary__invoice-title">Balance Due:</h4>
            <p class="summary__invoice-value">{{ formatCurrency(balanceDue) }}</p>
          </li>
        </ul>
      </div>
    </div>
    <div class="summary__section">
      <div class="summary__section-title">
        <h4>Total</h4>
        <p><strong>{{ formatCurrency(total) }}</strong></p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['orderNumber', 'orderStatus', 'paidAmount']),
    ...mapGetters([
      'cartItems',
      'itemCount',
      'subtotal',
      'smallTax',
      'largeTax',
      'serviceFee',
      'total',
      'balanceDue'
    ]),
    orderStatusLabel () {
      return this.orderStatus === 'PAID' ? 'Paid' : 'Open';
    }
  },
  methods: {
    clearProduct (productId) {
      this.$store.dispatch('clearProduct', productId);
    },
    formatCurrency (value) {
      return `$${value.toFixed(2)}`;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../scss/misc/colors.scss';

.summary {
  background-color: #fff;
  min-width: 305px;
  box-shadow: 0px 1px 15px 0px rgba(1, 1, 1, 0.15);
  height: 100%;
  min-height: 100vh;
  height: 100%;
  padding: 0 25px;

  &__order {
    text-align: center;
    margin-top: 20px;
    font-size: 24px;
    font-weight: 600;
    color: $text-dark;
    margin-bottom: 30px;
  }

  &__badge {
    display: inline-block;
    margin-left: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    background-color: #eef6ee;
    color: $green;
    font-size: 12px;
    vertical-align: middle;
  }

  &__section {
    margin-bottom: 40px;

    &-title {
      display: flex;
      justify-content: space-between;
      font-size: 20px;
      margin-bottom: 20px;

      h4 {
        color: $green;
        position: relative;

        &::before {
          content: "";
          background-color: $green;
          left: -30px;
          top: -5px;
          width: 10px;
          height: 35px;
          border-radius: 10px;
          position: absolute;
        }
      }

      p {
        color: $text-light;
      }

      strong{
        color: $text-dark;
      }
    }
  }

  &__products {
    ul {
      list-style-type: none;
    }
  }

  &__empty {
    color: $text-light;
    line-height: 1.4;
  }

  &__product {
    &-item {
      text-align: right;
      position: relative;
      margin-bottom: 20px;
    }

    &-delete {
      position: absolute;
      left: 10px;
      color: red;
      background-color: transparent;
      border: none;
    }

    &-title {
      color: $text-dark;
      font-weight: 600;
      font-size: 18px;
    } 

    &-info {
      color: $text-light;
    }
  }

  &__invoice {
    ul {
      list-style-type: none;
    }

    &-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;

      h4 {
        font-weight: 600;
      }

      p {
        color: $text-light;
      }
    }
  }
}

/* MM: Screen */
@media screen and (max-width: 1280px) { }

/* SM: Screen */
@media screen and (max-width: 1024px) { 
  .summary {
    min-width: 290px;
  }
}

/* Tablet/iPad */
@media screen and (max-width: 980px) { 
  .summary {
    min-width: 35%;
  }
}

/*iPhone 6/7*/
@media screen and (max-width: 500px) { 
  .summary {
    min-width: 290px;
    position: absolute;
    transform: translateX(-105%);
  }
}

/*iPhone 5 */
@media screen and (max-width: 320px) { }

</style>
