<template>
  <div id="app">
    <div class="pos">
      <Summary/>
      <div class="pos__main">
          <Header/>
          <NavigationBar/>
          <Main/>
      </div>
    </div>
  </div>
</template>

<script>
import Summary from './components/Summary.vue'
import Header from './components/Header.vue'
import NavigationBar from './components/NavigationBar.vue'
import Main from './components/Main.vue'

export default {
  name: 'app',
  components: {
    Summary,
    Header,
    NavigationBar,
    Main
  }
}
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
@media screen and (max-width: 1280px) { }

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
@media screen and (max-width: 500px) { }

/*iPhone 5 */
@media screen and (max-width: 320px) { }

</style>
