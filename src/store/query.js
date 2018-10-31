import axios from 'axios'

export default {
  namespaced: true,
  actions: {
    postCompile ({ rootState }, source) {
      return axios.post(`${rootState.STELLAR}/compile`, { source })
    },
    postDeploy ({ rootState }, [rawTransaction, name, canChange, canKill]) {
      return axios.post(`${rootState.TRUESCAN}/contract/create`, {
        rawTransaction,
        name,
        tag: 'ERC20',
        marks: `${
          canChange ? 'changeFounder=true' : ''
        }${
          canKill ? 'kill=true' : ''
        }`
      }, {
        headers: { Authorization: rootState.token }
      })
    },
    getContracts ({ rootState }) {
      return axios.get(`${rootState.TRUESCAN}/contracts`).then(res => {
        return res.data
      }).catch(err => {
        return {
          status: false,
          error: err,
          data: null
        }
      })
    },
    getTokenTxs ({ rootState }, { page, size, contract }) {
      const params = {
        page,
        size,
        contract
      }
      return axios.get(`${rootState.TRUESCAN}/txs/token`, {
        params
      }).then(res => {
        return res.data
      }).catch(err => {
        return {
          status: false,
          error: err,
          data: null
        }
      })
    }
  }
}
