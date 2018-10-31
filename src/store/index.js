import Vue from 'vue'
import Vuex from 'vuex'
import Web3 from 'web3'

import query from './query'

Vue.use(Vuex)

const web3 = new Web3('https://api.truescan.net/rpc')

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

const state = {
  eth: web3.eth,
  utils: web3.utils,

  STELLAR: 'https://stellar.truechain.pro/ethserver',
  TRUESCAN: 'https://api.truescan.net',

  token: '',

  updateTimer: 0,
  contractList: [],

  noticeBoxTimer: 0,
  noticeBox: null,
  noticeTextBox: null,
  hold: false
}

const mutations = {
  bindNoticeBox (state, el) {
    state.noticeBox = el
    state.noticeTextBox = el.querySelector('p')
  },
  holdNoticeBox (state, hold) {
    state.hold = hold
    if (!state.noticeBoxTimer && !hold) {
      state.noticeBox.style.transform = 'translateY(110%)'
    }
  },
  closeNoticeBox (state) {
    state.noticeBox.style.transform = 'translateY(110%)'
    state.noticeBoxTimer = 0
  },
  setToken (state, token) {
    state.token = token
  },
  updateContractList (state, contractList) {
    state.contractList = contractList
  }
}

const actions = {
  notice ({ state }, [color, text, time]) {
    const el = state.noticeBox
    const tel = state.noticeTextBox
    if (!el) {
      return
    }
    let delay = 0
    if (state.noticeBoxTimer) {
      clearTimeout(state.noticeBoxTimer)
      delay = 300
    }
    switch (color) {
      case 'log':
        color = '#2fa4d9'
        break
      case 'warn':
        color = '#ed951f'
        break
      case 'error':
        color = '#d80315'
        break
    }
    el.style.transform = 'translateY(110%)'
    el.style.backgroundColor = color
    tel.innerHTML = text
    setTimeout(() => {
      el.style.transform = 'translateY(0%)'
    }, delay)
    state.noticeBoxTimer = setTimeout(() => {
      if (!state.hold) {
        el.style.transform = 'translateY(110%)'
      }
      state.noticeBoxTimer = 0
    }, delay + time)
  },
  update ({ dispatch, commit, state }) {
    dispatch('query/getContracts').then(res => {
      if (!res.status) {
        return
      }
      const data = res.data
      const contractList = []
      for (const contract of data) {
        contractList.push(new ContractInfo(contract, state.eth))
      }
      commit('updateContractList', contractList)
    })
  },
  getBalance(_, [address, account]) {
    const c = new web3.eth.Contract(ABI, address)
    return c.methods.balanceOf(account).call()
  }
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  modules: {
    query
  },
  strict: false
})