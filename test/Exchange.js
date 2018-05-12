'use strict';

import expectThrow from "./helpers/expectThrow.js";
import {withRollback} from "./helpers/EVMSnapshots";
import assertBnEq from "./helpers/assertBigNumbersEqual";

const AtomicSwapRegistry = artifacts.require("AtomicSwapRegistry.sol");
const Exchange = artifacts.require("Exchange.sol");
const l = console.log;

contract('AtomicSwapRegistry', function (accounts) {

  const role = {
    owner: accounts[1],
    debtor1: accounts[2],
    creditor1: accounts[3],
    expert1: accounts[4]
  };


  let exchange, swapRegistry;

  beforeEach(async function () {
    swapRegistry = await AtomicSwapRegistry.new();

    exchange = await Exchange.new(
      swapRegistry.addres,
      {
        from: role.owner
      }
    );
  });

  it("complex test", async function () {


  });



});
