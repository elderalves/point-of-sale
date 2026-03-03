<template>
  <div class="pos__row">
    <div class="product-list">
      <ProductItem
        v-for="item in products"
        :key="item.id"
        :product="item"
      />
      <div v-if="!products.length" class="product-list__empty">
        No mock products are available for this category.
      </div>
    </div>
    <ProductCheckout/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import ProductItem from './ProductItem';
import ProductCheckout from './ProductCheckout';

export default {
  components: {
    ProductItem,
    ProductCheckout
  },
  computed: {
    ...mapGetters({
      products: 'filteredProducts'
    })
  }
}
</script>

<style lang="scss" scoped>
.product-list {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  &__empty {
    width: 100%;
    padding: 30px;
    border: 1px dashed #d9e2ec;
    border-radius: 5px;
    background-color: #fff;
    color: #7f8c8d;
    text-align: center;
  }
}


/* MM: Screen */
@media screen and (max-width: 1280px) { }

/* SM: Screen */
@media screen and (max-width: 1024px) { }

/* Tablet/iPad */
@media screen and (max-width: 980px) {
  .product {
    &-list {
      max-height: 700px;
      overflow-y: scroll;
    }
  }
}

/*iPhone 6/7*/
@media screen and (max-width: 500px) {
  .product {
    &-list {
      max-height: none;
      overflow-y: visible;
    }
  }
}

/*iPhone 5 */
@media screen and (max-width: 320px) { }
</style>
