<template>
    <div class="product__checkout">
        <PosButton type="success" label="Pay" />
        <PosButton type="default" label="Clear All Items" />
        <PosButton type="default" label="Clear Last Item" />
    </div>
</template>

<script>
import PosButton from "./shared/PosButton";

export default {
  components: {
    PosButton
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