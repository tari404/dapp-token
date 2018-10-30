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

const ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x06fdde03"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x18160ddd"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x313ce567"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x70a08231"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x95d89b41"}]

class ContractInfo {
  constructor (contract, eth) {
    this.name = contract.name || 'Unnamed ERC20 token'
    this.address = contract.address
    this.symbol = '...'
    this.decimals = '...'
    this.totalSupply = '...'
    this.updateBasicInfo(eth)
  }

  updateBasicInfo (eth) {
    const c = new eth.Contract(ABI, this.address)
    c.methods.symbol().call().then(res => { this.symbol = res })
    c.methods.decimals().call().then(res => { this.decimals = res })
    c.methods.totalSupply().call().then(res => { this.totalSupply = res })
  }
}

export default {
  name: 'Token',
  data () {
    return {
      contractList: []
    }
  },
  computed: {
    ...mapState({
      eth: state => state.eth
    })
  },
  mounted () {
    this.update()
  },
  methods: {
    ...mapActions({
      getContracts: 'query/getContracts'
    }),
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
    },
    update () {
      this.getContracts().then(res => {
        if (!res.data.status) {
          return
        }
        const data = res.data.data
        const contractList = []
        for (const contract of data) {
          contractList.push(new ContractInfo(contract, this.eth))
        }
        this.contractList = contractList
      })
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
