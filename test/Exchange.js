'use strict';

import expectThrow from "./helpers/expectThrow.js";
import {withRollback} from "./helpers/EVMSnapshots";
import assertBnEq from "./helpers/assertBigNumbersEqual";

const AtomicSwapRegistry = artifacts.require("AtomicSwapRegistry.sol");
const Exchange = artifacts.require("Exchange.sol");
const l = console.log;

contract('Exchange', function (accounts) {

  const role = {
    ex_owner: accounts[7],

    trader1: accounts[1],
    trader2: accounts[2],
    trader3: accounts[3],
    trader4: accounts[4],
    trader5: accounts[5],
    trader6: accounts[6]
  };

  const bc = {
    eth: 1,
    eth_kovan: 2,
    eth_rinkeby: 3,
    eos: 4
  };


  let ex, swReg, swRegKovan;

  beforeEach(async function () {
    swReg = await AtomicSwapRegistry.new();
    swRegKovan = await AtomicSwapRegistry.new();

    ex = await Exchange.new(swReg.address, {from:role.ex_owner, gasPrice:0});
  });

  it("test buy after sell orders", async function () {
    const secret = '123';
    const secretHash = web3.sha3(secret);


    let ownerInitBalane = await web3.eth.getBalance(role.ex_owner);

    let balanceBefore = await web3.eth.getBalance(role.trader1);
    await ex.deposit({value: web3.toWei(2), from: role.trader1, gasPrice: 0});
    await ex.deposit({value: web3.toWei(1), from: role.trader2});
    await ex.deposit({value: web3.toWei(1), from: role.trader3});
    await ex.deposit({value: web3.toWei(1), from: role.trader4});

    assertBnEq(web3.toWei(2), await ex.myDeposit({from: role.trader1}));
    await ex.withdraw(web3.toWei(1), {from: role.trader1, gasPrice: 0});
    assertBnEq(web3.toWei(1), await ex.myDeposit({from: role.trader1}));
    assertBnEq(balanceBefore.sub(web3.toWei(1)), await web3.eth.getBalance(role.trader1));

    //sell 1 kovan finney with price 0.5 ether for 1 kovan ether
    await ex.sell(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.5), {from: role.trader1});
    await ex.sell(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.7), {from: role.trader2});
    assertBnEq(web3.toWei(1), await ex.myDeposit({from: role.trader1}));
    assertBnEq(web3.toWei(1), await ex.myDeposit({from: role.trader2}));


    //want to buy 1 kovan finney with price 0.6 ether for 1 kovan ether
    await expectThrow(
      ex.buy(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.6), {from: role.trader3})
    ); // no hashes
    await ex.addHashes(secretHash, 0, 0, 0, 0, {from: role.trader3});
    assertBnEq(1, await ex.myHashesCount({from: role.trader3}));
    await ex.buy(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.6), {from: role.trader3});
    assertBnEq(web3.toWei(999.4, 'finney'), await ex.myDeposit({from: role.trader3}));
    assertBnEq(web3.toWei(3999.4, 'finney'), await web3.eth.getBalance(ex.address));

    //spread (0.6-0.5) was sent to owner
    assertBnEq(ownerInitBalane.add(web3.toWei(0.1, 'finney')), await web3.eth.getBalance(role.ex_owner));

    //next test swap registry
    assertBnEq(web3.toWei(0.5, 'finney'), await web3.eth.getBalance(swReg.address));
    //console.log(await swReg.swaps(web3.sha3('123')))
    assert.equal((await swReg.swaps(secretHash))[5], role.trader1);//participant
    await expectThrow(swReg.refund(secretHash), {from: role.trader3});
    await expectThrow(swReg.refund(secretHash), {from: role.trader1});


    //pseudo eth_kovan, participate
    await swRegKovan.participate(
      role.trader1, 3600, secretHash, role.trader3,
      {value: web3.toWei(1, 'finney'), from: role.trader1}
    );
    await expectThrow(swRegKovan.refund(secretHash), {from: role.trader3});
    await expectThrow(swRegKovan.refund(secretHash), {from: role.trader1});


    // //redeem 1
    let beforeRedeem1 = await web3.eth.getBalance(role.trader3);
    await swRegKovan.redeem(secret, secretHash);
    assertBnEq(beforeRedeem1.add(web3.toWei(1, 'finney')), await web3.eth.getBalance(role.trader3));

    assert.equal((await swRegKovan.swaps(secretHash))[3], secret);

    //redeem 2
    let beforeRedeem2 = await web3.eth.getBalance(role.trader1);
    await swReg.redeem(secret, secretHash);
    assertBnEq(beforeRedeem2.add(web3.toWei(0.5, 'finney')), await web3.eth.getBalance(role.trader1));


  });

  it("test buy after sell orders without price and than sell", async function () {
    const secret = '123';
    const secretHash = web3.sha3(secret);
    const secret2 = '1234';
    const secretHash2 = web3.sha3(secret2);


    let ownerInitBalane = await web3.eth.getBalance(role.ex_owner);

    await ex.deposit({value: web3.toWei(1), from: role.trader1});
    await ex.deposit({value: web3.toWei(1), from: role.trader2});
    await ex.deposit({value: web3.toWei(1), from: role.trader3});
    await ex.deposit({value: web3.toWei(1), from: role.trader4});


    //sell 1 kovan finney with price 0.5 ether for 1 kovan ether
    await ex.sell(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.7), {from: role.trader1});
    await ex.sell(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.6), {from: role.trader2});

    await ex.addHashes(secretHash, 0, 0, 0, 0, {from: role.trader3});
    await ex.addHashes(secretHash2, 0, 0, 0, 0, {from: role.trader4});

    //want to buy 1 kovan finney with price 0.4 ether for 1 kovan ether
    await ex.buy(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.4), {from: role.trader3});
    await ex.buy(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.5), {from: role.trader4});

    //sell 1 kovan finney with price 0.45 ether for 1 kovan ether
    await ex.sell(bc.eth_kovan, web3.toWei(1, 'finney'), web3.toWei(0.45), {from: role.trader5});
    assertBnEq(0, await ex.myHashesCount({from: role.trader4}));
    assertBnEq(web3.toWei(999.5, 'finney'), await ex.myDeposit({from: role.trader4}));
    assertBnEq(web3.toWei(3999.5, 'finney'), await web3.eth.getBalance(ex.address));
    //spread (0.5-0.45) was sent to owner
    assertBnEq(ownerInitBalane.add(web3.toWei(0.05, 'finney')), await web3.eth.getBalance(role.ex_owner));


    //next test swap registry
    assertBnEq(web3.toWei(0.45, 'finney'), await web3.eth.getBalance(swReg.address));
    assert.equal((await swReg.swaps(secretHash2))[5], role.trader5);//participant
    await expectThrow(swReg.refund(secretHash2), {from: role.trader4});
    await expectThrow(swReg.refund(secretHash2), {from: role.trader5});



  });



});

// проблемы
// подают заявки, но не покупают - система репутации