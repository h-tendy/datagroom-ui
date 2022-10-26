var assert = require('assert');
var toRoman = require('./../index.js').toRoman;

var literals = [ 1, 4, 8, 15, 16, 23, 42, 84, 100, 256, 512, 1024, 2048, 3999 ];
var objects = literals.map(function (x) { return new Number(x); });
var str_lit = literals.map(function (x) { return x.toString(); });
var str_obj = literals.map(function (x) { return new String(x); });
var answers = [ 'I', 'IV', 'VIII', 'XV', 'XVI', 'XXIII', 'XLII', 'LXXXIV', 'C',
  'CCLVI', 'DXII', 'MXXIV', 'MMXLVIII', 'MMMCMXCIX' ];


var bad_literals = [ {}, [], 'foo', function () {} ];
var bad_objects = [ new Object(), new Array(), new String('foo'), new Function() ];
var neg_literals = literals.map(function (x) { return x * -1; });

function wontThrow (arr) {
  return function () {
    arr.forEach(function (x) {
      assert.doesNotThrow(function () { toRoman(x); });
    });
  };
}

function makeThrow (arr) {
  return function () {
    arr.forEach(function (x) {
      assert.throws(function () { toRoman(x); });
    });
  };
}

function checkResults (arr) {
  return function () {
    arr.forEach(function (x, i) {
      assert.strictEqual(toRoman(x), answers[i]);
    });
  };
}

describe('toRoman function:', function () {
  describe('Checking good inputs', function () {
    it('Accepts literals numbers', wontThrow(literals));
    it('Accepts objects numbers', wontThrow(objects));
    it('Accepts string literal numbers', wontThrow(str_lit));
    it('Accepts string object numbers', wontThrow(str_obj));
  });
  describe('Checking wrong inputs', function () {
    it('Throws on non-numbers literals', makeThrow(bad_literals));
    it('Throws on non-number objects', makeThrow(bad_objects));
    it('Throws on NaN', makeThrow([ NaN ]));
    it('Throws on negative numbers', makeThrow(neg_literals));
    it('Throws on numbers over 3999', makeThrow([ 4000, 4242 ]));
  });
  describe('Checking results', function () {
    it('Works with a 0', function () {
      assert.strictEqual(toRoman(0), 'nulla');
      assert.strictEqual(toRoman(new Number(0)), 'nulla');
    })
    it('Works with literals', checkResults(literals));
    it('Works with objects', checkResults(objects));
    it('Works with string literal numbers', checkResults(str_lit));
    it('Works with string object numbers', checkResults(str_obj));
  });
});
