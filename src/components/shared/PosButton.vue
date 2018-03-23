<template>
    <button class="button" :class="buttonClass">
      {{this.label}}
    </button>
</template>

<script>
export default {
  props: ['type', 'label'],
  computed: {
    buttonClass() {
      switch(this.type) {
        case "default":
          return ['button-default']
        case "success":
          return ['button-success']
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../scss/misc/colors.scss';
.button {
  border-radius: 4px;
  font-size: 15px;
  outline: none;
  padding: 10px 20px;

  &:hover {
    outline: none;
  }

  &-default {
    background-color: #fafafa;
    border: 1px solid #e1e1e1;
    color: $text-dark;
  }

  &-success {
    background-color: $green;
    border: none;
    color: #fff;
    font-weight: 600;
    font-size: 18px;
  }
}
</style>