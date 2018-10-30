<template>
  <div class="main-width erc-content">
    <div class="erc-content-title">ERC20代币部署</div>
    <ul>
      <li> <label for="nick">代币昵称</label><input id="nick" type="text" v-model="nick"> </li>
      <li> <label for="name">代币名称</label><input id="name" type="text" v-model="name"> </li>
      <p class="erc-notice">* 建议使用英文例如：Test True Token</p>
      <li> <label for="symbol">代币符号</label><input id="symbol" type="text" v-model="symbol"> </li>
      <p class="erc-notice">* 建议使用英文大写缩写例如：TTT</p>
      <li> <label for="total-supply">总发行量</label><input id="total-supply" type="text" v-model="totalSupply" @change="checkTotalSupply"> </li>
      <p class="erc-notice">* 不包括小数部分</p>
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
import { mapState, mapActions } from 'vuex'

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
      totalSupplyIsValid: true,
      canChange: false,
      canKill: false
    }
  },
  computed: {
    ...mapState({
      eth: state => state.eth
    }),
    canDeploy () {
      return this.name && this.symbol && this.totalSupply && this.totalSupplyIsValid
    }
  },
  methods: {
    ...mapActions({
      postDeploy: 'query/postDeploy',
      postCompile: 'query/postCompile'
    }),
    checkTotalSupply () {
      this.totalSupplyIsValid = !this.totalSupply ||
        parseInt(this.totalSupply).toString() === this.totalSupply
    },
    reset () {
      this.nick = ''
      this.name = ''
      this.symbol = ''
      this.totalSupply = ''
      this.canChange = false
      this.canKill = false
    },
    deploy () {
      if (!this.canDeploy) {
        return
      }
      this.deploying = true
      this.deployStatus = '编译中...'
      this.toDeploy().then(res => {
        this.reset()
        const notice = `部署成功，合约地址为：${res.address}`
        this.$store.dispatch('notice', ['log', notice, 10000])
      }).catch(err => {
        this.$store.dispatch('notice', ['error', err.message, 10000])
      }).then(() => {
        this.deploying = false
        this.deployStatus = '部署'
      })
    },
    async toDeploy () {
      const source = ERC20Code.call(this)
      const compileRes = await this.postCompile(
        source
      ).catch(err => {
        console.warn(err.message || err)
        throw new Error('编译时错误，请尝试重试或联系网站管理员')
      })
      const data = compileRes.data
      if (compileRes.data.error) {
        throw new Error(compileRes.data.msg)
      }
      const input = '0x' + compileRes.data.contracts[':ERC20Token'].bytecode
      this.deployStatus = '签名中...'
      const { rawTransaction } = await this.eth.accounts.signTransaction({
        from: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
        gas: '2000000',
        gasPrice: '1',
        input
      }, '0x01').catch(err => {
        console.warn(err.message || err)
        throw new Error('无法对交易签名，请尝试重试或联系网站管理员')
      })
      this.deployStatus = '部署中...'
      const result = await this.postDeploy([
        rawTransaction,
        this.name,
        this.canChange,
        this.canKill
      ]).catch(err => {
        if (err.response) {
          console.log(err.response.status)
        }
        console.warn(err.message || err)
        throw new Error('部署时错误，合约可能已经部署，请通过truescan.net确认或联系网站管理员')
      })
      return result
    }
  },
  components: {
    Notice
  }
}
</script>

<style lang="stylus" scoped>
.erc-notice
  margin-top -12px
.erc-content li
  display flex
  margin 14px 0
</style>
