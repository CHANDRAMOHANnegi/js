Promise.resolve(1).then(2).then(console.log); // 1
Promise.reject(new Error("failed")).then(2, 2).then(console.log, console.log); // Error: failed

// 

/****
 * 
 * 1. If non function is passed to `.then()`, it is ignored entirely, and the promise simply passes through the resolved value(`1`)
 * to next `then()`
 * 
 * 
 * **/ 