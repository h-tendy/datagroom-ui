# TODO: Warnings and Errors from `npm run build` (updated)

I re-ran the build with `NODE_OPTIONS=--openssl-legacy-provider`. The OpenSSL error is resolved and the build succeeds, but there are several warnings to address. Work will be done in small batches.

Summary:
- Build: SUCCESS when using `NODE_OPTIONS=--openssl-legacy-provider`.
- Remaining notable items:
  - Deprecation: `fs.F_OK` is deprecated (DeprecationWarning DEP0176).
  - Browserslist: `caniuse-lite is outdated. Please run 'npm update'`.
  - Many ESLint warnings across multiple files (unused variables, eqeqeq, array-callback-return, no-unused-vars, no-useless-concat, no-mixed-operators, etc.).

Full notable output (trimmed to warnings/errors):

- Deprecation:
  - (node:40736) [DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead

- Browserslist:
  - Browserslist: caniuse-lite is outdated. Please run next command `npm update`

- ESLint warnings (grouped by file; each entry lists rule and brief note):

- `./src/common/routes/home/ds/jiraHelpers.js`:
  - many `eqeqeq` warnings: replace `==`/`!=` with `===`/`!==` where appropriate
  - many `no-unused-vars`: remove or use declared variables (`props`, `getState`, `setState`, `key`, `parsedKey`, `dispatch`, `field`, etc.)
  - `no-mixed-operators` at Line 680: clarify precedence with parentheses

- `./src/common/routes/home/AllDs.js`:
  - `eqeqeq` at Line 192
  - `no-unused-vars` (`sortBy`) at Line 268

- `./src/common/routes/home/DsViewEdit.js`:
  - many `no-unused-vars`: remove unused imports/variables (`Checkbox`, `dsHome`, `match`, `dsName`, etc.)
  - `array-callback-return` on multiple arrow functions: ensure map/filter callbacks return values
  - `no-useless-concat`: remove unnecessary string concatenations

- `./src/common/routes/home/QueryParsers.js`:
  - numerous `eqeqeq` and `no-unused-vars` warnings

- `./src/common/routes/home/DsView.js`:
  - many `no-unused-vars` and `eqeqeq` warnings
  - `no-unreachable` at Line 501: remove unreachable code
  - `array-callback-return` warnings: ensure callbacks return values
  - `no-useless-concat` at Line 774: simplify string concatenation

- (Additional files with warnings — summarized):
  - `upload.js`: `no-useless-computed-key`
  - `DsHome.js`, `NewDsFromDs.js`, `NewDsFromCsv.js`, `NewDsFromXls.js`, `DsBulkEdit.js`: `array-callback-return`
  - `clipboardHelpers.js`, `socketHandlers.js`, `tabulatorConfig.js`, `DsAttachments.js`, `MySingleAutoCompleter.js`, `MyAutoCompleter.js`, `MyCodeMirror.js`, `MyTextArea.js`: mixed `no-unused-vars`, `eqeqeq`, and other lint issues

Notes and suggested short-term fixes (small batches):

- Batch 1 (quick, low-risk):
  - Add `NODE_OPTIONS=--openssl-legacy-provider` to local build command or CI only if upgrading toolchain is not possible immediately. Document this as a temporary workaround. (Already used successfully.)
  - Run `npm update` to refresh `caniuse-lite` and eliminate the Browserslist notice.

- Batch 2 (mechanical code fixes — can be scripted/file-by-file):
  - Replace `==`/`!=` with `===`/`!==` where strict equality is intended. Use careful review in places where `==` may be intentional (e.g., handling null vs undefined).
  - Remove or use variables flagged by `no-unused-vars` (delete unused declarations/imports, or prefix with `_` if intentionally unused).
  - Fix `array-callback-return` by ensuring arrow functions used in `map`/`filter`/`forEach` return appropriately.
  - Fix `no-useless-concat` by merging string literals or using template literals.

- Batch 3 (review + refactor):
  - Address `no-mixed-operators` by adding parentheses to clarify precedence.
  - Remove unreachable code flagged by `no-unreachable`.
  - Add missing `default` cases for `switch` statements flagged by `default-case`.

How I suggest proceeding now (pick one):
- Option A: Apply Batch 1 now — run `npm update` and update `package.json` build script to include the `NODE_OPTIONS` workaround (temporary). Then re-run build and regenerate warnings file.
- Option B: Start Batch 2 on the highest-volume file (`./src/common/routes/home/ds/jiraHelpers.js`) and fix eslint warnings there first.

If you pick A, I will run `npm update` and patch `package.json` to add a cross-platform script for building with the legacy provider. If you pick B, I will open `jiraHelpers.js`, fix the top lint errors (unused vars and `eqeqeq`), and re-run the build to observe the delta.
