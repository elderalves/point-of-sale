<template>
  <div id="app">
    <Pos/>
  </div>
</template>

<script>
import Pos from "./components/Pos.vue";

export default {
  name: "app",
  components: {
    Pos
  }
};
</script>

<style lang="scss">
@import "/scss/app.scss";

.pos {
  display: flex;
  min-height: 100vh;

  &__main {
    width: 100%;
  }

  &__row {
    padding: 0 50px;
  }
}

/* MM: Screen */
@media screen and (max-width: 1280px) {
}

/* SM: Screen */
@media screen and (max-width: 1024px) {
  .pos {
    &__row {
      padding: 0 25px;
    }
  }
}

/* Tablet/iPad */
@media screen and (max-width: 980px) {
  .pos {
    &__main {
      min-width: 65%;
    }
  }
}

/*iPhone 6/7*/
@media screen and (max-width: 500px) {
}

/*iPhone 5 */
@media screen and (max-width: 320px) {
}
</style>
