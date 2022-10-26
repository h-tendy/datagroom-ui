const chalk = require('chalk');
const globby = require('globby');
const figures = require('figures');
const Prompt = require('inquirer/lib/prompts/base');
const observe = require('inquirer/lib/utils/events');
const { takeWhile } = require('rxjs/operators');

class GlobPrompt extends Prompt {
  _run(cb) {
    this.done = cb;

    // subscribe to line and keypress events
    let events = observe(this.rl);
    let dontHaveAnswer = () => !this.answer;

    events.line
      .pipe(takeWhile(dontHaveAnswer))
      .forEach(this.onSubmit.bind(this));
    events.keypress
      .pipe(takeWhile(dontHaveAnswer))
      .forEach(this.onKeypress.bind(this));

    // store the default pattern and glob for it on init
    this.default = this.opt.default;
    this.glob(this.default);
    return this;
  }

  render(error) {
    let content = this.getQuestion();
    let bottomContent = '';

    if (this.status === 'answered') {
      content += chalk.cyan(this.answer);
    } else if (this.paths.length) {
      content += this.rl.line;

      // paginate files in bottom content area
      let i = this.page.index * this.page.size;
      bottomContent += chalk.dim('- ' + (
        this.paths.slice(i, i + this.page.size)
      ).join('\n- '));

      bottomContent += `\n${this.paths.length} matching file`;
      if (this.paths.length > 1) bottomContent += 's';

      // show pagination
      if (this.page.length > 1) {
        bottomContent += ' (' + (
          `page ${this.page.index + 1} of ${this.page.length} ` +
          figures.arrowUp + figures.arrowDown
        ) + ')';
      }
    } else {
      content += this.rl.line;
      bottomContent += chalk.yellow('No matching files...');
    }

    if (error) {
      bottomContent += (bottomContent && '\n') + chalk.red('>> ') + error;
    }

    this.screen.render(content, bottomContent);
  }

  // asynchronously glob for file paths and re-render when done
  glob(pattern = '*') {
    let promise = this.promise = globby(pattern, this.opt.glob);
    this.page = this.page || { index: 0, size: this.opt.pageSize || 10 };
    this.pattern = pattern;

    return promise.then(paths => {
      if (this.promise !== promise) return;
      this.page.length = Math.ceil(paths.length / this.page.size);
      this.page.index = 0;
      this.paths = paths;
      this.render();
    });
  }

  // when "enter" is pressed, the rendered answer becomes the glob
  // but the returned answer is an array of matching paths
  onSubmit(line) {
    if (this.opt.forceMatch && !this.paths.length) {
      this.render('A matching pattern is required');
    } else {
      this.answer = line || this.rl.line || this.opt.default;
      this.status = 'answered';
      this.rl.line = '';
      this.render();
      this.screen.done();
      this.done(this.paths);
    }
  }

  onKeypress({ key }) {
    let { index: i, length: l } = this.page;

    // remove or restore rendering the default pattern
    this.opt.default = this.rl.line ? undefined : this.default;

    if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      // handle paging down
      this.page.index = Math.max(0, Math.min(l, i < l - 1 ? i + 1 : 0));
      this.render();
      // handle paging up
    } else if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      this.page.index = Math.max(0, Math.min(l, i > 0 ? i - 1 : l - 1));
      this.render();
    } else {
      // re-render on every key event
      this.render();

      // glob for paths when the pattern changes
      if (this.pattern !== this.rl.line) {
        this.glob(this.rl.line || this.default);
      }
    }
  }
}

module.exports = GlobPrompt;
