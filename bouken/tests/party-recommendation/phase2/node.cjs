'use strict';
const Phase1=require('../engine.cjs'),Lab=require('./core.js');
const load=()=>Phase1.load();
const fixture=(r,spec)=>Lab.makeFixture(r,spec,Phase1.fixture);
module.exports={...Lab,Phase1,load,fixture};
