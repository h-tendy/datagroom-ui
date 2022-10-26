(function () {
  var forEach = Array.prototype.forEach;


  /**
   * Converts a roman number to its arabic equivalent.
   *
   * Will throw TypeError on non-string inputs.
   *
   * @param {String} roman
   * @return {Number}
   */
  function toArabic (roman) {
    if (('string' !== typeof roman) && (!(roman instanceof String))) throw new TypeError('toArabic expects a string');

    // Zero is/was a special case. I'll go with Dionysius Exiguus on this one as
    // seen on http://en.wikipedia.org/wiki/Roman_numerals#Zero
    if (/^nulla$/i.test(roman) || !roman.length) return 0;

    // Ultra magical regexp to validate roman numbers!
    roman = roman.toUpperCase().match(/^(M{0,3})(CM|DC{0,3}|CD|C{0,3})(XC|LX{0,3}|XL|X{0,3})(IX|VI{0,3}|IV|I{0,3})$/);
    if (!roman) throw new Error('toArabic expects a valid roman number');
    var arabic = 0;

    // Crunching the thousands...
    arabic += roman[1].length * 1000;

    // Crunching the hundreds...
    if (roman[2] === 'CM') arabic += 900;
    else if (roman[2] === 'CD') arabic += 400;
    else arabic += roman[2].length * 100 + (roman[2][0] === 'D' ? 400 : 0);


    // Crunching the tenths
    if (roman[3] === 'XC') arabic += 90;
    else if (roman[3] === 'XL') arabic += 40;
    else arabic += roman[3].length * 10 + (roman[3][0] === 'L' ? 40 : 0);

    // Crunching the...you see where I'm going, right?
    if (roman[4] === 'IX') arabic += 9;
    else if (roman[4] === 'IV') arabic += 4;
    else arabic += roman[4].length * 1 + (roman[4][0] === 'V' ? 4 : 0);
    return arabic;
  };


  module.exports = toArabic;

})();
