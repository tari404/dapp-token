<template>
  <div class="main-width erc-content">
    <div class="erc-content-title">ERC20代币部署</div>
    <ul>
      <li> <label for="nick">代币昵称</label><input id="nick" type="text" v-model="nick"> </li>
      <li> <label for="name">*代币名称</label><input id="name" type="text" v-model="name"> </li>
      <li> <label for="symbol">*代币简称</label><input id="symbol" type="text" v-model="symbol"> </li>
      <li> <label for="total-supply">*总发行量</label><input id="total-supply" type="text" v-model="totalSupply"> </li>
      <li> <label for="can-change">允许更换管理员</label><input id="can-change" type="checkbox" v-model="canChange"> </li>
      <li> <label for="can-kill">允许销毁</label><input id="can-kill" type="checkbox" v-model="canKill"> </li>
    </ul>
    <div class="erc-button" :class="{ 'erc-button-active': canDeploy && !deploying }">
      <div @click="deploy">{{ deployStatus }}</div>
    </div>
  </div>
</template>

<script>
import Notice from '@/components/Notice'
import axios from 'axios'
import Web3 from 'web3'

const STELLAR = 'https://stellar.truechain.pro/ethserver'
const TRUESCAN = 'https://api.truescan.net'

const ERC20Code = function () {
  const name = this.name || 'Unnamed ERC20 token'
  const symbol = this.symbol || 'UNKNOW'
  const totalSupply = this.totalSupply || 100000000
  return `
pragma solidity ^0.4.23;

library SafeMath {
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}

contract ERC20Token {
    using SafeMath for uint256;
    string public constant name = "${name}";
    string public constant symbol = "${symbol}";
    uint256 public constant decimals = 18;
    uint256 public constant totalSupply = ${totalSupply} * 10 ** decimals;
    address private founder = 0x0;
    uint256 private distributed = 0;

    mapping (address => uint256) private balances;
    mapping (address => mapping (address => uint256)) private allowed;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    constructor() public { 
        founder = msg.sender;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require (_to != 0x0, "");
        require((balances[msg.sender] >= _value), "");
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require (_to != 0x0, "");
        require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value, "");
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function distribute(address _to, uint256 _amount) public returns (bool success) {
        require(msg.sender == founder, "");
        require(distributed.add(_amount) <= totalSupply, "");

        distributed = distributed.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Transfer(this, _to, _amount);
        return true;
    }
    ${this.canChange ? `
    function changeFounder(address newFounder) public {
        require(msg.sender == founder, "");

        founder = newFounder;
    }
    ` : ''}
    ${this.canKill ? `
    function kill() public {
        require(msg.sender == founder, "");

        selfdestruct(founder);
    }
    ` : ''}
}`
}

const web3 = new Web3(`${TRUESCAN}/rpc`)

export default {
  name: 'Deploy',
  data () {
    return {
      deployStatus: '部署',
      deploying: false,
      nick: '',
      name: '',
      symbol: '',
      totalSupply: '',
      canChange: false,
      canKill: false
    }
  },
  computed: {
    canDeploy () {
      return this.name && this.symbol && this.totalSupply
    }
  },
  methods: {
    deploy () {
      if (!this.canDeploy) {
        return
      }
      this.deploying = true
      this.deployStatus = '编译中...'
      this.toDeploy().then(res => {
        console.log(res)
      }).catch(err => {
        console.warn(err)
      }).then(() => {
        this.deploying = false
        this.deployStatus = '部署'
      })
    },
    async toDeploy () {
      const source = ERC20Code.call(this)
      const compileRes = await axios.post(`${STELLAR}/compile`, {
        source
      }).catch(err => {
        throw err
      })
      const data = compileRes.data
      if (compileRes.data.error) {
        throw new Error(compileRes.data.msg)
      }
      const input = '0x' + compileRes.data.contracts[':ERC20Token'].bytecode
      this.deployStatus = '签名中...'
      const { rawTransaction } = await web3.eth.accounts.signTransaction({
        from: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
        gas: '2000000',
        gasPrice: '1',
        input
      }, '0x01').catch(err => {
        throw err
      })
      this.deployStatus = '部署中...'
      const result = await axios.post(`${TRUESCAN}/contract/create`, {
        rawTransaction,
        name: this.name,
        tag: 'ERC20'
      }, {
        headers: { Authorization: 'rc9KrAMIYanqXByX/xBVcVGgfD+nS1mzzWk9Ejk7FV0=' }
      }).catch(err => {
        throw err
      })
      return result
    }
  },
  components: {
    Notice
  }
}
</script>
