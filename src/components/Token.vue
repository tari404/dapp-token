<template>
  <div class="main-width erc-content">
    <div class="erc-content-title">ERC20代币信息</div>
    <ul>
      <li v-for="(item, index) in contractList" :key="index">
        <p>代币地址: {{item.address}}</p>
        <p>代币名称: {{item.name}}</p>
        <p>代币符号: {{item.symbol}}</p>
        <p>总发行量: 
          <span>{{parseBalance(item.totalSupply, item.decimals).i}}</span>
          <span class="decimals">{{parseBalance(item.totalSupply, item.decimals).d}}</span>
        </p>
      </li>
    </ul>
  </div>
</template>

<script>
import BN from 'bn.js'
import { mapActions, mapState } from 'vuex'

export default {
  name: 'Token',
  computed: {
    ...mapState({
      contractList: state => state.contractList
    })
  },
  mounted () {
    this.$store.dispatch('update')
  },
  methods: {
    parseBalance (input, decimals) {
      const decs = parseInt(decimals) || 18
      let balance
      if (input.substr(0, 2) === '0x') {
        balance = new BN(input.slice(2), 16)
      } else {
        balance = new BN(input, 10)
      }
      const balanceStr = balance.toString().padStart(decs + 1, '0')
      const i = balanceStr.slice(0, -decs)
      const d = Array.prototype.reduce.call(balanceStr.slice(-decs), (res, n, i) => res + (i % 3 ? n : ',' + n), '')
      return { i, d }
    }
  }
}
</script>

<style lang="stylus" scoped>
.erc-content li
  margin 14px 0
  padding 10px
  border-radius 5px
  border solid 1px #ddd
  p
    margin 4px 0
  .decimals
    font-size 14px
    color #666
</style>
