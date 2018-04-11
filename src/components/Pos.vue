<template>
  <div class="pos">
      <div class="summary">
        <h3 class="summary__order">ORDER #23934 {{ count }}</h3>
        <div class="summary__section">
          <div class="summary__section-title">
            <h4>Items</h4>
            <p>$97,50</p>
          </div>
          <div class="summary__products">
            <ul>
              <li class="summary__product-item">
                <button class="summary__product-delete">X</button>
                <h4 class="summary__product-title">Pizza-16 Inch Pepperoni</h4>
                <p class="summary__product-info">1 Qtd - $30.00</p>
              </li>
              <li class="summary__product-item">
                <button class="summary__product-delete">X</button>
                <h4 class="summary__product-title">2 Cookies & Slice of Cake</h4>
                <p class="summary__product-info">8 Qtd - $30.00</p>
              </li>
              <li class="summary__product-item">
                <button class="summary__product-delete">X</button>
                <h4 class="summary__product-title">Laser Tag Game</h4>
                <p class="summary__product-info">5 Qtd - $37.50</p>
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
                <h4 class="summary__invoice-title">Pre-total</h4>
                <p class="summary__invoice-value">$97.50</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">1% Tax:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">10% Tax:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">AppInsightsTest:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">Sales Tax:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">Sub-total:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">Service Fee:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">Total with Service Fee:</h4>
                <p class="summary__invoice-value">$97.50</p>
              </li>
              <li class="summary__invoice-item">
                <h4 class="summary__invoice-title">Payments:</h4>
                <p class="summary__invoice-value">$0.00</p>
              </li>
            </ul>
          </div>
        </div>
        <div class="summary__section">
          <div class="summary__section-title">
            <h4>Total</h4>
            <p><strong>$97,50</strong></p>
          </div>
        </div>
      </div>
      <div class="pos__main">
          <header>
            <div class="pos__row">
              <div class="header__order">
                <PosButton type="default" label="Cancel Order" />
                <PosButton type="default" label="Select Customer" />
              </div>
              <div class="header__links">
                <ul>
                  <li><a href="#">Lookup Pre-Paid</a></li>
                  <li><a href="#">Lookup Order</a></li>
                  <li><a href="#">Exit POS</a></li>
                </ul>
              </div>
            </div>
          </header>
          <div class="navigation-bar">
            <div class="pos__row">
              <ul>
                <li class="active">
                  <a href="#">
                    <i class="fa fa-cube"></i>
                    <span>QA</span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i class="fa fa-cube"></i>
                    <span>Pizza</span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i class="fa fa-cube"></i>
                    <span>Session M</span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i class="fa fa-cube"></i>
                    <span>LoyalTree</span>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i class="fa fa-cube"></i>
                    <span>Category 5</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <main>
            <div class="pos__row">
      <div class="product-list">
        <ProductItem 
          v-for="item in products" 
          :key="item.id"
          :product="item" 
        />
        </div>
        <div class="product__checkout">
        <PosButton type="success" label="Pay" />
        <PosButton type="default" label="Clear All Items" />
        <PosButton type="default" label="Clear Last Item" />
    </div>
        </div>
          </main>
      </div>
    </div>
</template>

<script>
import PosButton from "./shared/PosButton";
import ProductItem from "./ProductItem";

import ProductData from "./../data/products.json";

export default {
  data() {
    return {
      products: ProductData
    };
  },
  components: {
    PosButton,
    ProductItem
  }
};
</script>

<style lang="scss" scoped>
@import "../scss/misc/colors.scss";

.product-list {
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

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

.navigation-bar {
  background-color: #3475b7;
  height: 105px;
  display: flex;
  align-items: center;

  ul {
    list-style-type: none;
    display: flex;
    align-items: center;
  }

  a {
    text-decoration: none;
  }

  i {
    color: #3475b7;
    margin-right: 10px;
  }

  li {
    margin-right: 30px;

    &:not(.active) {
      a {
        color: #fff;
      }
      i {
        background-color: #fff;
        padding: 10px 10px;
        border-radius: 5px;
      }
    }
    &.active {
      a {
        color: #3475b7;
        background-color: #fff;
        border-radius: 5px;
        background-color: rgb(255, 255, 255);
        padding: 10px 10px;
      }
    }
  }
}

/* SM: Screen */
@media screen and (max-width: 1024px) {
  .navigation-bar {
    li {
      a {
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        min-width: 75px;
      }
      i {
        margin-right: 0;
      }
    }
  }
}

/* Tablet/iPad */
@media screen and (max-width: 980px) {
  .navigation-bar {
    overflow-x: scroll;
    &::-webkit-scrollbar {
      width: 2px;
      height: 4px;
    }
    &::-webkit-scrollbar-track {
      background: #fff;
      border-radius: 0;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      background: #295a8e;
    }
  }
}

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

      strong {
        color: $text-dark;
      }
    }
  }

  &__products {
    ul {
      list-style-type: none;
    }
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
  &__links {
    display: flex;
    align-items: center;
    ul {
      list-style-type: none;
      display: flex;
    }

    li {
      margin-left: 40px;
    }
    a {
      color: $text-light;
      text-decoration: none;

      &:hover {
        color: $text-dark;
      }
    }
  }
}

/* SM: Screen */
@media screen and (max-width: 1024px) {
  .header {
    &__links {
      li {
        margin-left: 15px;
      }
    }
  }
}
</style>
