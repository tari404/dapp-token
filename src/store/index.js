import Vue from 'vue'
import Vuex from 'vuex'
import Web3 from 'web3'

import query from './query'

Vue.use(Vuex)

const web3 = new Web3('https://api.truescan.net/rpc')

const state = {
  eth: web3.eth,

  STELLAR: 'https://stellar.truechain.pro/ethserver',
  TRUESCAN: 'https://api.truescan.net',

  token: '',

  updateTimer: 0,

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
  update (state) {
    state.updateTimer++
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
    tel.innerText = text
    setTimeout(() => {
      el.style.transform = 'translateY(0%)'
    }, delay)
    state.noticeBoxTimer = setTimeout(() => {
      if (!state.hold) {
        el.style.transform = 'translateY(110%)'
      }
      state.noticeBoxTimer = 0
    }, delay + time)
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