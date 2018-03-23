<template>
    <div class="pos__row">
      <div class="product-list">
        <ProductItem 
          v-for="item in products" 
          :key="item.id"
          :product="item" 
        />
      </div>
      <ProductCheckout/>
    </div>
</template>

<script>

import ProductItem from './ProductItem';
import ProductCheckout from './ProductCheckout';

import ProductData from './../data/products.json';

export default {
  data() {
    return {
      products: ProductData
    }
  },
  components: {
    ProductItem,
    ProductCheckout
  }
}
</script>

<style lang="scss" scoped>
.product-list {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
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