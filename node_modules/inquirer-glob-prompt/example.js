const inquirer = require('inquirer');
const { inspect } = require('util');

inquirer.registerPrompt('glob', require('.'));

inquirer.prompt([{
  type: 'glob',
  name: 'files',
  message: 'Which files?',
  default: '**/*',
  glob: {
    ignore: 'node_modules'
  }
}]).then(answers => {
  console.log(inspect(answers, { colors: true }));
});
