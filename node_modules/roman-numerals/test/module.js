var assert = require('assert');
var module = require('./../index.js');

describe('romanNumerals Module:', function () {
  describe('Core functionalities', function () {
    it('Got a toArabic() function', function () {
      assert.strictEqual('function', typeof module.toArabic);
    });
    it('Got a toRoman() function', function () {
      assert.strictEqual('function', typeof module.toRoman);
    });
  });
  describe('Compatibility between the two functions', function () {
    it('toArabic accepts all toRoman outputs', function () {
      for (var i = 0; i < 4000; ++i) {
        assert.doesNotThrow(function () { module.toArabic(module.toRoman(i)); });
      }
    });
    it('toRoman then toArabic returns same number', function () {
      for (var i = 0; i < 4000; ++i) {
        assert.strictEqual(i, module.toArabic(module.toRoman(i)));
      }
    });
    it('toArabic then toRoman returns same string', function () {
      for (var i = 0; i < 4000; ++i) {
        var j = module.toRoman(i);
        assert.strictEqual(j, module.toRoman(module.toArabic(j)));
      }
    });
  });
});
