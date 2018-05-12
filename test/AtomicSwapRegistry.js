'use strict';

import expectThrow from "./helpers/expectThrow.js";
import {withRollback} from "./helpers/EVMSnapshots";
import assertBnEq from "./helpers/assertBigNumbersEqual";

const AtomicSwapRegistry = artifacts.require("AtomicSwapRegistry.sol");
const l = console.log;

contract('AtomicSwapRegistry', function (accounts) {

  const role = {
    owner: accounts[1],
    debtor1: accounts[2],
    creditor1: accounts[3],
    expert1: accounts[4]
  };


  let instance;

  beforeEach(async function () {

    instance = await AtomicSwapRegistry.new(
      {
        from: role.owner
      }
    );
  });

  it("complex test", async function () {


  });



});
