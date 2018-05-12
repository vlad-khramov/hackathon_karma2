const promisify = func => async (...args) =>
  new Promise((accept, reject) =>
    func(...args, (error, result) => (error ? reject(error) : accept(result)))
  );

export const rpcCommand = method => async (...params) =>
  (await promisify(web3.currentProvider.sendAsync)({
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now()
  })).result;

export const evm_mine = rpcCommand("evm_mine");
export const evm_increaseTime = rpcCommand("evm_increaseTime");
export const evm_snapshot = rpcCommand("evm_snapshot");
export const evm_revert = rpcCommand("evm_revert");

export async function withRollback(func) {
    const snapshotId = await evm_snapshot();
    await func();
    await evm_revert(snapshotId);
}