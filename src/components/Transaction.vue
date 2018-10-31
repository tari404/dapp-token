<template>
  <div class="main-width erc-content">
    <div class="erc-content-title">ERC20数字资产流动记录</div>
    <div class="erc-select" :class="{ 'erc-select-close': !selectOpen }" @click="clickSelect">
      <ul :style="{ 'transform': `translateY(${-optionIndex * 40}px)` }" @mousewheel="scrollOptions">
        <li v-for="(item, index) in contractList" :key="index"
          :class="{ 'focus': selectOpen && index === optionIndex }"
          @click="clickOption($event, index)">{{item.name}}</li>
      </ul>
    </div>
    <table class="erc-tokentxs">
      <thead>
        <tr>
          <th>交易Hash</th>
          <th>时间</th>
          <th>发起方</th>
          <th>接收方</th>
          <th>数额</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in txList" :key="index">
          <td><tt>{{item.txHash.slice(0, 12)}}...{{item.txHash.slice(62, 66)}}</tt></td>
          <td>{{getDuration(now - item.time)}}</td>
          <td><tt>{{item.from.slice(0, 6)}}...{{item.from.slice(38, 42)}}</tt></td>
          <td><tt>{{item.to.slice(0, 6)}}...{{item.to.slice(38, 42)}}</tt></td>
          <td>{{item.balanceI}}<span class="erc-decimals">{{item.balanceD}}</span></td>
        </tr>
      </tbody>
    </table>
    <p class="erc-nodata" v-if="txList.length === 0">没有流动记录</p>
  </div>
</template>

<script>
import BN from 'bn.js'
import { mapState } from 'vuex'

const tSec = 1000
const tMin = tSec * 60
const tHr = tMin * 60
const tDay = tHr * 24
const tYear = tDay * 365

export default {
  name: 'Transaction',
  data () {
    return {
      wheelStep: 0,
      selectOpen: false,
      optionIndex: 0,

      txList: [],
      now: new Date().getTime()
    }
  },
  computed: {
    ...mapState({
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
    foucsContract (newObj) {
      if (newObj.address) {
        this.$store.dispatch('query/getTokenTxs', {
          page: 0,
          contract: newObj.address
        }).then(res => {
          if (res.status) {
            this.txList = res.data[0]
            this.updateAge()
            this.updateValue(newObj.decimals)
          }
        })
      }
    }
  },
  mounted () {
    setInterval(() => {
      this.now = new Date().getTime()
    }, 1000)
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
    getDuration (time) {
      if (time < tMin) {
        const secs = parseInt(time / tSec)
        return `${secs}秒前`
      } else if (time < tHr) {
        const secs = parseInt(time % tMin / tSec)
        const mins = parseInt(time / tMin)
        const secsStr = secs ? `${secs}秒` : '钟'
        return `${mins}分${secsStr}前`
      } else if (time < tDay) {
        const mins = parseInt(time % tHr / tMin)
        const hrs = parseInt(time / tHr)
        const minsStr = mins ? `${mins}分钟` : ''
        return `${hrs}小时${minsStr}前`
      } else if (time < tYear) {
        const hrs = parseInt(time % tDay / tHr)
        const days = parseInt(time / tDay)
        const hrsStr = hrs ? `${hrs}小时` : ''
        return `${days}天${hrsStr}前`
      } else {
        const years = parseInt(time / tYear)
        return `> ${years} year`
      }
    },
    updateAge () {
      const now = new Date()
      this.txList.forEach(datum => {
        if (!datum.timestamp) {
          datum.time = false
        } else {
          datum.time = new Date(datum.timestamp)
        }
      })
    },
    updateValue (decimals) {
      this.txList.forEach(datum => {
        const { i, d } = this.parseBalance(datum.value, decimals)
        datum.balanceI = i
        datum.balanceD = d
      })
    }
  },
  beforeDestroy () {
    document.removeEventListener('click', this.onClick)
  }
}
</script>

<style lang="stylus" scoped>
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
.erc-tokentxs
  width 100%
  margin-top 30px
  font-size 16px
  text-align center
  line-height 40px
  thead
    background-color #0d85da
    color #fff
  .erc-decimals
    line-height 30px
.erc-nodata
  margin 0
  text-align center
  line-height 40px
  color #999
  border-radius 3px
  background-color #f0f4f8
</style>
