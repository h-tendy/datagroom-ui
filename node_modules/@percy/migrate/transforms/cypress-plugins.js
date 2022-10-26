/**
 * Transforms cypress/plugins/index.js to remove @percy/cypress/task usage.
 *
 * --print-options=JSON    output print options (default: {"quote":"single","lineTerminator":"\n"})
*/
export default function({ source }, { j }, options) {
  let root = j(source);
  let local;

  // - import <local> from '@percy/cypress/task'
  root
    .find(j.ImportDeclaration, node => (
      node.source.value === '@percy/cypress/task'
    ))
    .forEach(({ value: node }) => {
      local = node.specifiers[0].local.name;
    })
    .remove();

  // - const <local> = require('@percy/cypress/task')
  root
    .find(j.VariableDeclarator, node => (
      node.init?.type === 'CallExpression' &&
      node.init.callee.name === 'require' &&
      node.init.arguments[0].value === '@percy/cypress/task'
    ))
    .forEach(({ value: node }) => {
      local = node.id.name;
    })
    .remove();

  // - on('task', <local>)
  // - on('task', require('@percy/cypress/task'))
  root
    .find(j.CallExpression, node => (
      node.callee.name === 'on' &&
      node.arguments[0]?.type === 'Literal' &&
      node.arguments[0].value === 'task' &&
      ((node.arguments[1]?.type === 'Identifier' &&
        node.arguments[1].name === local) ||
       (node.arguments[1]?.type === 'CallExpression' &&
        node.arguments[1].callee.name === 'require' &&
        node.arguments[1].arguments[0].value === '@percy/cypress/task'))
    ))
    .remove();

  return root.toSource({
    quote: 'single',
    lineTerminator: '\n',
    ...options['print-options']
  });
}
