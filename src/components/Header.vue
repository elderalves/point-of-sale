<template>
  <header>
    <div class="pos__row">
      <div class="header__order">
        <PosButton
          type="default"
          label="Cancel Order"
          @click="cancelOrder"
        />
        <PosButton
          type="default"
          :label="customerLabel"
          @click="cycleCustomer"
        />
      </div>
      <div class="header__status">
        <ul>
          <li>Order #{{ orderNumber }}</li>
          <li>{{ itemCount }} {{ itemLabel }}</li>
          <li>{{ statusLabel }}</li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import PosButton from './shared/PosButton';

export default {
  components: {
    PosButton
  },
  computed: {
    ...mapState(['orderNumber', 'orderStatus']),
    ...mapGetters(['itemCount', 'selectedCustomer']),
    customerLabel () {
      return `Customer: ${this.selectedCustomer}`;
    },
    itemLabel () {
      return this.itemCount === 1 ? 'item' : 'items';
    },
    statusLabel () {
      return this.orderStatus === 'PAID' ? 'Status: Paid' : 'Status: Open';
    }
  },
  methods: {
    cancelOrder () {
      this.$store.dispatch('cancelOrder');
    },
    cycleCustomer () {
      this.$store.dispatch('cycleCustomer');
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../scss/misc/colors.scss';

header {
  background-color: #fff;
  width: 100%;
  min-height: 100px;
  display: flex;
  align-items: center;

  .pos__row {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  button {
   margin-right: 10px; 
  } 
}

.header {
  &__status {
    display: flex;
    align-items: center;

    ul {
      list-style-type: none;
      display: flex;
    }

    li {
      margin-left: 40px;
      color: $text-light;
      font-weight: 600;
    }
  }
}

/* MM: Screen */
@media screen and (max-width: 1280px) { }

/* SM: Screen */
@media screen and (max-width: 1024px) { 
  .header {
    &__status {
      li {
        margin-left: 15px;
      }
    }
  }
}

/* Tablet/iPad */
@media screen and (max-width: 980px) {
 
}

/*iPhone 6/7*/
@media screen and (max-width: 500px) { }

/*iPhone 5 */
@media screen and (max-width: 320px) { }

</style>
