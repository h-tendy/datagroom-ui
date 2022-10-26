var assert = require('assert');
var toArabic = require('./../index.js').toArabic;

var literals = [ 'I', 'IV', 'VIII', 'XV', 'XVI', 'XXIII', 'XLII', 'LXXXIV', 'C',
  'CCLVI', 'DXII', 'MXXIV', 'MMXLVIII', 'MMMCMXCIX' ];
var objects = literals.map(function (x) { return new String(x) });
var lowercase = literals.map(function (x) { return x.toLowerCase(); });
var answers = [ 1, 4, 8, 15, 16, 23, 42, 84, 100, 256, 512, 1024, 2048, 3999 ];

var bad_literals = [ 42 ]//{}, [], 42, function () {} ];
var bad_objects = [ new Object(), new Array(), new Number(42), new Function () ];
var bad_strings = [ 'foo', 'bar', 'foobar', 'red', 'MMORPG', 'CCCC' ];

function wontThrow (arr) {
  return function () {
    arr.forEach(function (x) {
      assert.doesNotThrow(function () { toArabic(x); });
    });
  };
}

function makeThrow (arr) {
  return function () {
    arr.forEach(function (x) {
      assert.throws(function () { toArabic(x); }, "Because of __" + x);
    });
  };
}

function checkResults (arr) {
  return function () {
    arr.forEach(function (x, i) {
      assert.strictEqual(toArabic(x), answers[i]);
    });
  };
}

describe('toArabic function:', function () {
  describe('Checking good inputs', function () {
    it('Accepts literals strings', wontThrow(literals));
    it('Accepts objects strings', wontThrow(objects));
    it('Accepts lowercase strings', wontThrow(lowercase));
  });
  describe('Checking wrong inputs', function () {
    it('Throws on non-string literals', makeThrow(bad_literals));
    it('Throws on non-string objects', makeThrow(bad_objects));
    it('Throws on incorrect strings', makeThrow(bad_strings));
  });
  describe('Checking results', function () {
    it('Works with a "nulla"', function () {
      assert.strictEqual(toArabic('nulla'), 0);
      assert.strictEqual(toArabic('nuLLa'), 0);
      assert.strictEqual(toArabic(new String('nulla')), 0);
      assert.strictEqual(toArabic(new String('nuLLa')), 0);
    });
    it('Works with an empty string', function () {
      assert.strictEqual(toArabic(''), 0);
      assert.strictEqual(toArabic(new String('')), 0);
    });
    it('Works with string literals ', checkResults(literals));
    it('Works with string objects', checkResults(objects));
    it('Works with lowercase strings', checkResults(lowercase));
  });

});
