<template>
  <div id="app">
    <nav>
      <div class="main-width">
        <span>ERC20数字资产管理平台</span>
        <input type="text" v-model="token" @focus="clearInput" @change="updateToken">
      </div>
    </nav>
    <section>
      <div class="main-width">
        <ul class="erc-menu">
          <li v-for="(item, index) in menu"
            :key="index"
            :class="{ 'focus': route === index }"
            @click="toggleRoute(index)">{{item}}</li>
        </ul>
      </div>
    </section>
    <section>
      <deploy v-show="route === 0"/>
      <transfer v-show="route === 1"/>
      <token v-show="route === 2"/>
      <transaction v-show="route === 3"/>
    </section>
    <notice />
  </div>
</template>

<script>
import Notice from '@/components/Notice'
import Deploy from '@/components/Deploy'
import Transfer from '@/components/Transfer'
import Token from '@/components/Token'
import Transaction from '@/components/Transaction'

export default {
  name: 'App',
  data () {
    return {
      route: 0,
      token: '输入Token',
      menu: [
        '部署',
        '管理',
        '资产信息',
        '流动记录'
      ]
    }
  },
  methods: {
    toggleRoute (index) {
      this.route = index
    },
    clearInput () {
      this.token = ''
    },
    updateToken () {
      this.$store.commit('setToken', this.token)
    }
  },
  components: {
    Notice,
    Deploy,
    Transfer,
    Token,
    Transaction
  }
}
</script>

<style lang="stylus">
body
  margin 0
  background-color #f0f4f8
  font-family Avenir,Helvetica,Arial,sans-serif
body::-webkit-scrollbar
  display none
  width 0
  height 0
  opacity 0
a
  color inherit
ul
  margin 0
  padding 0
li
  list-style none

.main-width
  margin auto
  flex 0 0 800px
  box-sizing border-box

nav
  height 80px
  display flex
  background-color #fff
  box-shadow 0 2px 4px #0001
  font-size 20px
  div
    padding 0 10px
    line-height 40px
  input
    float right
    color #999
section
  margin 20px 10px
  display flex

label
  display block
  line-height 40px
  width 130px
  height 40px
input
  font-family inherit
  font-size inherit
  box-sizing border-box
  border-radius 3px
  border 1px solid #ddd
  font-size 16px
  outline none
  height 40px
  margin 0
  padding 0 9px

.erc-menu
  float left
  border-radius 5px
  overflow hidden
  display grid
  grid-gap 1px
  grid-template-columns repeat(4, 110px)
  box-shadow 0 2px 4px #0001
  li
    height 60px
    line-height 60px
    text-align center
    background-color #fff
    margin-right 1px
  .focus
    background-color #0d85da
    color #fff
.erc-content
  background-color #fff
  border-radius 5px
  background-color #fff
  padding 20px
  box-shadow 0 2px 4px #0001
  min-width 320px
.erc-content-title
  font-size 18px
  line-height 30px

.erc-notice
  font-size 12px
  color #666

.erc-button
  border-radius 3px
  color #fff
  width 150px
  height 40px
  text-align center
  line-height 40px
  background-color #ccc
  transition background-color .4s
  div
    border-radius 3px
    transition background-color .4s,transform .4s
    background-color #bbb
.erc-button-active
  background-color #0072c1
  div
    background-color #0d85da
    cursor pointer
    transform translateY(-10px)
    &:hover
      transform translateY(-6px)

.erc-decimals
  font-size 14px
  color #666
</style>
