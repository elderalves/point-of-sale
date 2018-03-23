<template>
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
</template>

<script>
import { mapState } from 'vuex';
export default {
  computed: mapState({
    count: state => state.count
  })
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