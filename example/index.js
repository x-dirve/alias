const { alias } = require("../dist");
alias({
    // "file": "./aliases.json"
});

const Consts = require("@/const");
const test = require("@components/test");
test();
console.log("CONSTs", Consts.TEST_CONST);

const Consts2 = require("@/const");
console.log("CONSTs2", Consts2.TEST_CONST);