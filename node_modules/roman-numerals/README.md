# roman-numerals #
## Installation ##
Using git:

    $ git clone git@github.com:joshleaves/roman-numerals.git

## Usage ##

### roman-numerals.toArabic(roman) ###
toArabic() takes a roman number (as a string literal or a string object) and returns a number with the arabic equivalent.

    var toArabic = require('roman-numerals').toArabic;
    [ 'XLII', new String('XLII') ].forEach(function (x, i) {
        console.log('%d: %s', i, toArabic(x));
    });
Will output:

    0: 42
    1: 42

toArabic() will throw a TypeError when passed a non-string variable and will throw an Error when passed an invalid roman number. Acceptable strings are also `"nulla"` and `""` (that's empty string) which will both return 0.

### roman-numerals.toRoman(arabic) ###
toRoman() takes an arabic number (as a number literal, a number object, a stringed literal number or a stringed object number) and returns a string with the roman equivalent.

    var toRoman = require('roman-numerals').toRoman;
    [ 42, new Number(42), '42', new String('42')].forEach(function (x, i) {
        console.log('%d: %s', i, toRoman(x));
    });
Will output:

    0: XLII
    1: XLII
    2: XLII
    3: XLII

toRoman() will throw a TypeError when passed a non-number variable or NaN and will throw an Error when passed a number under 0 or over 3999.

## Tests ##
Unit tests are done using [mocha](https://github.com/visionmedia/mocha/). To run the tests on your machine, install mocha using npm and run `make test` or `npm test`.

    $ npm install --dev
    $ make test

You can also use `make nyan` for something new.
