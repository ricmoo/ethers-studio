
let debug = false;

(async function() {

})().catch((error) => {
    if (debug) {
        console.log("Error", error);
    } else {
        console.log("Error", error);
    }
    process.exit(1);
});
