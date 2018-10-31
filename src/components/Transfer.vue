<template>
  <div class="main-width erc-content">
    <div class="erc-content-title">ERC20数字资产管理</div>
    <div class="erc-select" :class="{ 'erc-select-close': !selectOpen }" @click="clickSelect">
      <ul :style="{ 'transform': `translateY(${-optionIndex * 40}px)` }" @mousewheel="scrollOptions">
        <li v-for="(item, index) in contractList" :key="index"
          :class="{ 'focus': selectOpen && index === optionIndex }"
          @click="clickOption($event, index)">{{item.name}}</li>
      </ul>
    </div>
    <p class="erc-contract-info"><span>数字资产符号</span>{{foucsContract.symbol}}</p>
    <p class="erc-contract-info"><span>数字资产地址</span>{{foucsContract.address}}</p>
    <hr>
    <div class="erc-query">
      <div class="erc-button" :class="{ 'erc-button-active': balanceQueryIsVaild }">
        <div @click="queryBalance">资产查询</div>
      </div>
      <div class="erc-query-input">
        <input type="text" v-model="queryAddress" @change="checkBalanceQuery">
        <span>账户地址</span>
      </div>
      <div class="erc-query-output">{{balanceI}}<span class="erc-decimals">{{balanceD}}</span></div>
    </div>
    <div class="erc-query">
      <div class="erc-button" :class="{ 'erc-button-active': distributeIsVaild }">
        <div @click="distribute">资产空投</div>
      </div>
      <div class="erc-query-input">
        <input type="text" v-model="distributeAddress" @change="checkDistribute">
        <span>目标账户地址</span>
      </div>
      <div class="erc-query-input">
        <input type="text" v-model="distributeValue" @change="checkDistribute">
        <span>资产数量（整数部分）</span>
      </div>
    </div>
  </div>
</template>

<script>
import BN from 'bn.js'
import { mapState } from 'vuex'

const txBody = (account, value) => '0xfb932108' +
  account.replace(/0x/, '').toLocaleLowerCase().padStart(64, '0') +
  new BN(value, 10).toString(16).padStart(64, '0')

const toWei = (value, decimals) => {
  const array = value.split('.')
  return array[0] + (array[1] || '').substr(0, decimals).padEnd(decimals, '0')
}

export default {
  name: 'Transfer',
  data () {
    return {
      wheelStep: 0,
      selectOpen: false,
      optionIndex: 0,

      queryAddress: '',
      balanceI: '',
      balanceD: '',
      distributeAddress: '',
      distributeValue: '',
      balanceQueryIsVaild: false,
      distributeIsVaild: false
    }
  },
  computed: {
    ...mapState({
      utils: state => state.utils,
      eth: state => state.eth,
      contractList: state => state.contractList
    }),
    foucsContract () {
      return this.contractList[this.optionIndex] || {
        symbol: '...',
        address: '...'
      }
    }
  },
  watch: {
    optionIndex () {
      this.balanceI = ''
      this.balanceD = ''
    }
  },
  mounted () {
    document.addEventListener('click', this.onClick)
  },
  methods: {
    onClick () {
      this.selectOpen = false
    },
    clickSelect (event) {
      if (!this.selectOpen) {
        event.stopPropagation()
        this.selectOpen = true
      }
    },
    scrollOptions (event) {
      if (event.deltaY < 0 && this.optionIndex > 0) {
        this.wheelStep--
      } else if (event.deltaY > 0 && this.optionIndex < this.contractList.length - 1) {
        this.wheelStep++
      }
      if (this.wheelStep >= 2) {
        this.wheelStep -= 2
        this.optionIndex++
      } else if (this.wheelStep <= -2) {
        this.wheelStep += 2
        this.optionIndex--
      }
    },
    clickOption (event, index) {
      if (this.selectOpen) {
        event.stopPropagation()
        this.optionIndex = index
        this.selectOpen = false
      }
    },
    checkBalanceQuery () {
      this.balanceI = ''
      this.balanceD = ''
      this.balanceQueryIsVaild = this.utils.isAddress(this.queryAddress)
    },
    checkDistribute () {
      this.distributeIsVaild = this.utils.isAddress(this.distributeAddress) &&
      Number(this.distributeValue).toString() === this.distributeValue
    },
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
    queryBalance () {
      if (!this.balanceQueryIsVaild) {
        return
      }
      this.balanceI = ''
      this.balanceD = ''
      this.$store.dispatch('getBalance', [
        this.foucsContract.address,
        this.queryAddress
      ]).then(res => {
        const decimals = this.foucsContract.decimals || 18
        const { i, d } = this.parseBalance(res, decimals)
        this.balanceI = i
        this.balanceD = d
      })
    },
    distribute () {
      if (!this.distributeIsVaild) {
        return
      }
      this.toDistribute().then(res => {
        const notice = `空投成功 交易详情请见<a target="_black" href="https://www.truescan.net/tx/${res.transactionHash}">TrueScan</a>平台`
        this.$store.dispatch('notice', ['log', notice, 15000])
      }).catch(err => {
        this.$store.dispatch('notice', ['error', err.message, 10000])
      })
    },
    async toDistribute () {
      const c = this.foucsContract
      const input = txBody(this.distributeAddress, toWei(this.distributeValue, c.decimals))
      const { rawTransaction } = await this.eth.accounts.signTransaction({
        from: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
        to: c.address,
        gas: '200000',
        gasPrice: '1',
        input
      }, '0x01').catch(err => {
        console.warn(err.message || err)
        throw new Error('无法对交易签名，请尝试重试或联系网站管理员')
      })
      return this.eth.sendSignedTransaction(rawTransaction).then(res => {
        return res
      }).catch(err => {
        console.warn(err.message || err)
        throw new Error('交易失败，请尝试重试或联系网站管理员')
      })
    }
  },
  beforeDestroy () {
    document.removeEventListener('click', this.onClick)
  }
}
</script>

<style lang="stylus" scoped>
hr
  margin 30px 0
  border none
  height 1px
  background-color #ccc
.erc-select
  margin 14px 0
  width 300px
  height 40px
  line-height 40px
  border-radius 3px
  border solid 1px #999
  cursor pointer
  ul
    position relative
    z-index 99
    transition transform .6s
    margin -1px -1px
    background-color #fff
    border-radius 3px
    border solid 1px #999
  li
    padding 0 9px
    transition background-color .4s
  .focus
    background-color #f0f4f8
.erc-select-close
  overflow hidden
  position relative
  &:after
    content ''
    position absolute
    right 10px
    top 17px
    width 0
    height 0
    border-top 5px solid #999
    border-left 5px solid transparent
    border-right 5px solid transparent
    z-index 100
.erc-contract-info
  font-size 14px
  line-height 20px
  margin 4px 0
  display flex
  span
    display block
    width 100px
.erc-query
  display flex
  margin-top 20px
.erc-query-input
  margin-left 10px
  span
    font-size 14px
    line-height 20px
    display block
.erc-query-output
  margin-left 10px
  height 40px
  line-height 40px
</style>
