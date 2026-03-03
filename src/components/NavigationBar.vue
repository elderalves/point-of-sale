<template>
  <div class="navigation-bar">
    <div class="pos__row">
      <ul>
        <li
          v-for="category in categories"
          :key="category"
          :class="{ active: activeCategory === category }"
        >
          <button type="button" @click="setCategory(category)">
            <i class="fa fa-cube"></i>
            <span>{{ category }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['activeCategory']),
    ...mapGetters(['categories'])
  },
  methods: {
    setCategory (category) {
      this.$store.dispatch('setActiveCategory', category);
    }
  }
}
</script>

<style lang="scss" scoped>
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

  i {
    color: #3475b7;
    margin-right: 10px;
  }

  button {
    border: none;
    background: transparent;
    cursor: pointer;
    text-decoration: none;
    font-size: 16px;
  }

  li {
    margin-right: 30px;

    &:not(.active) {
      button {
        color: #fff;
      }
      i {
        background-color: #fff;
        padding: 10px 10px;
        border-radius: 5px;
      }
    }
    &.active {
      button {
        color: #3475b7;
        background-color: #fff;
        border-radius: 5px;
        background-color: rgb(255, 255, 255);
        padding: 10px 10px;
      }
    }
  }
}

/* MM: Screen */
@media screen and (max-width: 1280px) { }

/* SM: Screen */
@media screen and (max-width: 1024px) { 
  .navigation-bar {
     li {
       button {
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

/*iPhone 6/7*/
@media screen and (max-width: 500px) { 
  
}

/*iPhone 5 */
@media screen and (max-width: 320px) { }

</style>
