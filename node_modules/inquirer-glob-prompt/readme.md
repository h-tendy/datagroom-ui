# inquirer-glob-prompt

Glob prompt for [inquirer](https://github.com/SBoudrias/Inquirer.js#readme). Prompts for a glob and lists
matching files as you type.

## Installation

``` shell
$ npm install --save inquirer-glob-prompt
```

## Usage

``` javascript
const inquirer = require('inquirer')

// you can change 'glob' to any prefered type name
inquirer.registerPrompt('glob', require('inquirer-glob-prompt'))

inquirer.prompt([{
  type: 'glob',
  name: 'filePaths'
  // ...
}]).then(answers => {
  console.log(answers)
})
```

### Options

Takes `type`, `name`, `message`[, `default`, `when`, `pageSize`, `glob`] properties. See
[inquirer](https://github.com/SBoudrias/Inquirer.js#question) documentation for properties other than `glob`.

**glob** (Object) options are passed directly to [globby](https://github.com/sindresorhus/globby#readme)
during initial render and whenever input changes.

### Example

Run the [example](./example.js):

``` sh
$ node example.js
```

## License

[MIT](./LICENSE)
