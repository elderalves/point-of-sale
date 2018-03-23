<template>
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
</template>

<script>

import PosButton from './shared/PosButton';

export default {
  components: {
    PosButton
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

/* MM: Screen */
@media screen and (max-width: 1280px) { }

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

/* Tablet/iPad */
@media screen and (max-width: 980px) {
 
}

/*iPhone 6/7*/
@media screen and (max-width: 500px) { }

/*iPhone 5 */
@media screen and (max-width: 320px) { }

</style>