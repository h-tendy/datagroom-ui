const { EventEmitter } = require('events');
const stripAnsi = require('strip-ansi');
const dedent = require('dedent');

// mock/spy globby
const globby = jasmine.createSpy('globby', require('globby'));
Object.assign(require.cache[require.resolve('globby')], { exports: globby });

// required after mocking globby
const Prompt = require('..');

// stub readline like inquirer does for its own tests
class ReadlineStub extends EventEmitter {
  constructor() {
    Object.assign(super(), {
      line: '',
      input: new EventEmitter(),
      write: jasmine.createSpy('write').and.returnValue(this),
      moveCursor: jasmine.createSpy('moveCursor').and.returnValue(this),
      setPrompt: jasmine.createSpy('setPrompt').and.returnValue(this),
      close: jasmine.createSpy('close').and.returnValue(this),
      pause: jasmine.createSpy('pause').and.returnValue(this),
      resume: jasmine.createSpy('resume').and.returnValue(this),
      _getCursorPos: jasmine.createSpy('_getCursorPos')
        .and.returnValue({ cols: 0, rows: 0 }),
      output: {
        string: '',
        end: jasmine.createSpy('end'),
        mute: jasmine.createSpy('mute'),
        unmute: jasmine.createSpy('unmute'),
        // strip ansi for testing
        write: string => {
          string = stripAnsi(string).trim();
          if (/\w/.test(string)) this.output.string = string;
        }
      }
    });
  }
}

describe('inquirer-glob-prompt', () => {
  let rl, question, prompt;

  // promised to use microtask queue
  let submit = async () => (
    rl.emit('line'));
  let type = async str => str.split('').forEach(c => (
    (rl.line += c), rl.input.emit('keypress', c)));
  let press = async (name, opts) => (
    rl.input.emit('keypress', '', { name, ...opts }));

  beforeEach(() => {
    globby.and.resolveTo([]);
    globby.calls.reset();

    rl = new ReadlineStub();

    question = {
      name: 'test',
      message: 'test:'
    };
  });

  it('waits for a line return before resolving', async () => {
    prompt = new Prompt(question, rl).run();
    await expectAsync(prompt).toBePending();

    await submit();
    await expectAsync(prompt).toBeResolved();
  });

  it('globs for "*" on init and displays matching files', async () => {
    globby.and.resolveTo(['matching', 'files']);
    prompt = new Prompt(question, rl).run();

    expect(globby).toHaveBeenCalledOnceWith('*', undefined);
    await expectAsync(prompt).toBePending();

    expect(rl.output.string).toEqual(dedent`
      ? test:${' '}
      - matching
      - files
      2 matching files
    `);

    await submit();
    await expectAsync(prompt).toBeResolvedTo(['matching', 'files']);
  });

  it('shows a message when there are no matching files', async () => {
    prompt = new Prompt(question, rl).run();
    await expectAsync(prompt).toBePending();

    expect(rl.output.string).toEqual(dedent`
      ? test:${' '}
      No matching files...
    `);

    await submit();
    await expectAsync(prompt).toBeResolvedTo([]);
  });

  it('only globs when the pattern changes', async () => {
    prompt = new Prompt(question, rl).run();
    await expectAsync(prompt).toBePending();

    expect(globby).toHaveBeenCalledTimes(1);

    await type('*'); // *

    expect(globby).toHaveBeenCalledTimes(1);

    await type('*'); // **

    expect(globby).toHaveBeenCalledTimes(2);

    await submit();
    await expectAsync(prompt).toBeResolvedTo([]);
  });

  it('provides glob options to globby', async () => {
    question.glob = { ignore: 'node_modules' };
    prompt = new Prompt(question, rl).run();
    await expectAsync(prompt).toBePending();

    expect(globby).toHaveBeenCalledOnceWith('*', question.glob);

    await submit();
    await expectAsync(prompt).toBeResolvedTo([]);
  });

  describe('with forced matching', () => {
    beforeEach(async () => {
      question.forceMatch = true;
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
    });

    it('prevents submitting empty matches when forceMatch is true', async () => {
      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        No matching files...
      `);

      await submit();
      await expectAsync(prompt).toBePending();

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        No matching files...
        >> A matching pattern is required
      `);

      globby.and.resolveTo(['any']);

      await type('**').then(submit);
      await expectAsync(prompt).toBeResolvedTo(['any']);
    });
  });

  describe('with a default pattern', () => {
    beforeEach(async () => {
      question.default = '**/default.js';
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
    });

    afterEach(async () => {
      await submit();
      await expectAsync(prompt).toBeResolvedTo([]);
    });

    it('accepts and shows a default pattern', () => {
      expect(rl.output.string).toEqual(dedent`
        ? test: (**/default.js)${' '}
        No matching files...
      `);
    });

    it('clears the default pattern when typing', async () => {
      await type('**/*');

      expect(rl.output.string).toEqual(dedent`
        ? test: **/*
        No matching files...
      `);
    });

    it('restores the default prompt when empty', async () => {
      await type('**/*');

      expect(rl.output.string).toEqual(dedent`
        ? test: **/*
        No matching files...
      `);

      rl.line = '';
      await press('delete');

      expect(rl.output.string).toEqual(dedent`
        ? test: (**/default.js)${' '}
        No matching files...
      `);
    });
  });

  describe('pagination', () => {
    let paths;

    beforeEach(() => {
      paths = Array(12).fill('').map((_, i) => `fake/file/${i + 1}`);
      globby.and.resolveTo(paths);
    });

    it('paginates matching files in excess of 10 by default', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(0, 10).join('\n- ')}
        12 matching files (page 1 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('paginates matching files in excess of the defined pageSize', async () => {
      question.pageSize = 5;
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(0, 5).join('\n- ')}
        12 matching files (page 1 of 3 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('allows paging down with the down arrow', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
      await press('down');

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(10).join('\n- ')}
        12 matching files (page 2 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('allows paging down with ctrl + n', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
      await press('n', { ctrl: true });

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(10).join('\n- ')}
        12 matching files (page 2 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('wraps around when paging down', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
      await press('down');

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(10).join('\n- ')}
        12 matching files (page 2 of 2 ↑↓)
      `);

      await press('down');

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(0, 10).join('\n- ')}
        12 matching files (page 1 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('allows paging up with the up arrow', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
      await press('down');

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(10).join('\n- ')}
        12 matching files (page 2 of 2 ↑↓)
      `);

      await press('up');

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(0, 10).join('\n- ')}
        12 matching files (page 1 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('allows paging up with ctrl + p', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
      await press('n', { ctrl: true });

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(10).join('\n- ')}
        12 matching files (page 2 of 2 ↑↓)
      `);

      await press('p', { ctrl: true });

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(0, 10).join('\n- ')}
        12 matching files (page 1 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });

    it('wraps around when paging up', async () => {
      prompt = new Prompt(question, rl).run();
      await expectAsync(prompt).toBePending();
      await press('up');

      expect(rl.output.string).toEqual(dedent`
        ? test:${' '}
        - ${paths.slice(10).join('\n- ')}
        12 matching files (page 2 of 2 ↑↓)
      `);

      await submit();
      await expectAsync(prompt).toBeResolvedTo(paths);
    });
  });
});
