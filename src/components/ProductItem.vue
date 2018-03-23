<template>
    <div class="product__item" :class="{'product__item-cart': isOnCart}">
      <div class="product__content">
        <div class="product__color"></div>
        <div class="product__name">{{ product.name }}</div>
      </div>
      <div class="product__action">
        <p class="product__qtd">{{ qtd }}</p>
        <div class="product__controls">
          <button @click="removeProduct()" class="product__subtraction">-</button>
          <button @click="addProduct" class="product__addition">+</button>
        </div>
      </div>
    </div>
</template>

<script>
import { TweenMax, TimelineMax, Power0 } from 'gsap';
import { findAncestor } from './../helpers/DOM';

export default {
  props: ['product'],
  data() {
    return {
      qtd: 0
    }
  },
  computed: {
    isOnCart() {
      return (this.qtd > 0) ? true : false;
    }
  },
  methods: {
    addProduct(event) {
      this.qtd++;
      if(this.qtd === 1) {
        const productItem = findAncestor(event.target, 'product__item');
        this.animateAddProduct(productItem);
      }
    },
    removeProduct() {
      (this.qtd > 0) ? this.qtd-- : null;
    },
    animateAddProduct(productItem) {
      let tl = new TimelineMax();
      tl.add(TweenMax.to(productItem, .3, {scale:1.05}));
      tl.add(TweenMax.to(productItem, .2, {scale:1}));
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../scss/misc/colors';

.product {
  &__item {
    background-color: #fff;
    border: 1px solid #edf2f6;
    width: 31%;
    margin-bottom: 30px;
    border-radius: 5px;
    box-shadow: 0px 0px 3px 0px rgba(1, 1, 1, 0.14);
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 70px;
    overflow: hidden;

    &-cart {
      border: 1px solid $green;

      .product__color {
        background-color: $green;
      }

    }
  }

  &__content {
    display: flex;
    align-items: center;
    padding-left: 15px;
  }

  &__color {
    border-radius: 4px;
    background-color: rgb(243, 156, 18);
    width: 30px;
    height: 30px;
  }

  &__name {
    margin-left: 10px;
    font-size: 18px;
  }

  &__action {
    padding: 0 15px;
    position: relative;

    &::before {
      content: "";
      border-left: 3px dashed #edf2f6;
      height: 220px;
      left: 0;
      top: -10px;
      position: absolute;
    }
  }

  &__controls {
    border-radius: 5px;
    width: 60px;
    border-radius: 5px;
    overflow: hidden;
    button {
      width: 30px;
      height: 27px;
      box-shadow: none;
      border: none;
      font-size: 14px;
      font-weight: 700;
      outline: none;

      &:focus {
        outline: none;
      }
    }
  }

  &__subtraction {
    background-color: #f6f6f6;
    color: $text-dark;
  }

  &__addition {
    background-color: #c2c2c2;
    color: #fff;
  }

  &__qtd {
    text-align: center;
    font-size: 20px;
    margin-bottom: 3px;
  }
}

/* MM: Screen */
@media screen and (max-width: 1280px) { }

/* SM: Screen */
@media screen and (max-width: 1024px) { 
  .product {
    &__item {
      width: 49%;
    }
  }
}

/* Tablet/iPad */
@media screen and (max-width: 980px) { 
  .product {
    &__item {
      width: 100%;
    }
  }
}

/*iPhone 6/7*/
@media screen and (max-width: 500px) { 
  .product {
    &__item {
      width: 100%;
      height: 80px;
      margin-bottom: 18px;
    }
    &__name {
      font-size: 16px;
    }
    &__controls {
      width: 70px;

      button {
        width: 35px;
        height: 33px;
      }
    }
  }
}

/*iPhone 5 */
@media screen and (max-width: 320px) { }

</style>