const p = new Promise((res, rej) => {
    setTimeout(() => {
        console.log("==hello")
        res(" world ")
    }, 1000)
})

p.then(d => {
    console.log("-", d)
})

setTimeout(() => {
    p.then(d => {
        console.log("--", d)
    })
}, 2000) 