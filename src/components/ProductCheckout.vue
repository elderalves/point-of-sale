<template>
  <div class="product__checkout">
    <PosButton
      type="success"
      :label="payLabel"
      :disabled="!itemCount || isPaid"
      @click="payOrder"
    />
    <PosButton
      type="default"
      label="Clear All Items"
      :disabled="!itemCount"
      @click="clearCart"
    />
    <PosButton
      type="default"
      label="Clear Last Item"
      :disabled="!itemCount"
      @click="removeLastItem"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import PosButton from "./shared/PosButton";

export default {
  components: {
    PosButton
  },
  computed: {
    ...mapGetters(['itemCount', 'isPaid', 'total']),
    payLabel () {
      if (this.isPaid) {
        return 'Paid';
      }

      if (!this.itemCount) {
        return 'Pay';
      }

      return `Pay ${this.formatCurrency(this.total)}`;
    }
  },
  methods: {
    clearCart () {
      this.$store.dispatch('clearCart');
    },
    removeLastItem () {
      this.$store.dispatch('removeLastItem');
    },
    payOrder () {
      this.$store.dispatch('payOrder');
    },
    formatCurrency (value) {
      return `$${value.toFixed(2)}`;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../scss/misc/colors';
.product {
  &__checkout {
    button {
      margin-right: 10px;

      &.button-success {
        padding-left: 40px;
        padding-right: 40px; 
      } 
    }
  }
}
</style>
