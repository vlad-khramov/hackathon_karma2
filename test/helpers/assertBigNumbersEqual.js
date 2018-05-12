const assertBnEq = (a, b, message) =>  {
  assert(web3.toBigNumber(a).eq(b), `${message} (${a.valueOf()} != ${b.valueOf()})`)
};


export default assertBnEq;