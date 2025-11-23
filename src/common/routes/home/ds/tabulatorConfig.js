// Tabulator configuration and callbacks skeleton
export default function createTabulatorConfig(context) {
  const { props, getState, setState, component, ref, MyTextArea, MyCodeMirror, DateEditor, MyAutoCompleter, MySingleAutoCompleter, QueryParsers, MarkdownIt } = context;

  function setColumnDefinitions() {
    // Use the current component props at call time to avoid stale snapshot
    // values captured at helper construction. This ensures `dsHome` and
    // other props are available after async loads.
    const { match, dsHome } = component.props;
    let dsName = match.params.dsName;
    let dsView = match.params.dsView;
    // If dsHome or the view metadata isn't ready yet, return empty columns
    // so the table renders once the data is loaded. This prevents
    // exceptions during initial render when props are still being fetched.
    if (!dsHome || !dsHome.dsViews || !dsHome.dsViews[dsView] || !dsHome.dsViews[dsView].columnAttrs) {
      return [];
    }
    let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
    let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
    let me = component;
    let headerMenuWithoutHide = [
      { label: "Toggle Filters", action: me.toggleSingleFilter },
      { label: "Freeze", action: me.freezeColumn },
      { label: "Unfreeze", action: me.unfreezeColumn }
    ];
    let headerMenuWithHide = [
      { label: "Toggle Filters", action: me.toggleSingleFilter },
      { label: "Freeze", action: me.freezeColumn },
      { label: "Unfreeze", action: me.unfreezeColumn },
      { label: "<i class='fas fa-eye-slash'></i> Hide Column", action: me.hideColumn },
      { label: "<i class='fas fa-eye'></i> Unhide all Columns", action: me.showAllCols }
    ];
    let cellContextMenu = [
      { label: "Copy cell to clipboard...", action: me._clipboard.copyCellToClipboard },
      { label: "Generate slides...", action: me.startPreso },
      { label: "Generate URL.....", menu: [
        { label: "Copy URL for this row to clipboard...", action: function (e, cell) { me.urlGeneratorFunction(e, cell, false) } },
        { label: "Copy URL for current view to clipboard...", action: function (e, cell) { me.urlGeneratorFunction(e, cell, true); } }
      ] },
      { separator: true },
      { label: "Hide/Unhide column...", menu: [
        { label: "<i class='fas fa-eye-slash'></i> Hide Column", action: me.hideColumnFromCell },
        { label: "<i class='fas fa-eye'></i> Unhide all Columns", action: me.showAllCols }
      ] },
      { label: "Add row.....", menu: [
        { label: "Duplicate row & add (above)", action: function (e, cell) { me.duplicateAndAddRowHandler(e, cell, true) } },
        { label: "Duplicate row & add (below)", action: function (e, cell) { me.duplicateAndAddRowHandler(e, cell, false) } },
        { label: "Add empty row...", action: function (e, cell) { me.addRow(e, cell, null, true) } }
      ] },
      { label: "Delete row....", menu: [
        { label: "Delete all rows in view...", action: me.deleteAllRowsInViewQuestion },
        { label: "Delete all rows in query...", action: me.deleteAllRowsInQuery },
        { label: "Delete row...", action: me.deleteRowQuestion }
      ] },
      { label: "Delete column...", menu: [ { label: "Delete column...", action: function (e, cell) { me.deleteColumnQuestion(e, cell); } } ] },
      { label: "Add Column", menu: [ { label: "Add Column", action: function (_, cell) { me.addColumnQuestion(cell.getColumn().getField()); } } ] },
      { label: "Get xlsx....", menu: [
        { label: "Get xlsx for whole DS...", action: function () { let useQuery = false; me.downloadXlsx(useQuery); } },
        { label: "Get xlsx in query...", action: function () { let useQuery = true; me.downloadXlsx(useQuery); } }
      ] },
      { label: "JIRA Menu....", menu: [
        { label: "Convert to JIRA row...", action: me.convertToJiraRow },
        { label: "Add new JIRA...", action: function (e, cell) { me.addJiraRow(e, cell, null) } },
        { label: "Add Story to Epic", action: function (e, cell) { me.addJiraRow(e, cell, 'Story') } },
        { label: "Add a Story Task to Story", action: function (e, cell) { me.addJiraRow(e, cell, 'Story Task') } }
      ] }
    ];

    let columns = [];
    for (let i = 0; i < dsHome.dsViews[dsView].columnAttrs.length; i++) {
      let col = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].columnAttrs[i]));
      if (!me.isKey(col.field)) {
        col.headerMenu = headerMenuWithHide;
      } else {
        col.headerMenu = headerMenuWithoutHide;
        col.titleFormatter = (t, titleFormatterParams) => { return `<u>${t.getValue()}</u>`; };
      }
      col.contextMenu = cellContextMenu;
      col.editable = me.cellEditCheck;
      col.cellForceEditTrigger = me.cellForceEditTrigger;
      if (getState().showAllFilters) {
        col.headerFilter = "input";
        if (col.headerFilterType) col.headerFilter = col.headerFilterType;
      }

      function doConditionalFormatting (cell, formatterParams) {
        if (formatterParams && formatterParams.conditionalFormatting) {
          let rowData = cell.getRow().getData();
          for (let i = 0; i < formatterParams.conditionalExprs.length; i++) {
            let exprStr = formatterParams.conditionalExprs[i].split('->')[0].trim();
            let expr = QueryParsers.parseExpr(exprStr);
            if (QueryParsers.evalExpr(expr, rowData, cell.getColumn().getField())) {
              let values = formatterParams.conditionalExprs[i].split('->')[1].trim();
              values = JSON.parse(values);
              if (values.backgroundColor) cell.getElement().style.backgroundColor = values.backgroundColor;
              if (values.color) cell.getElement().style.color = values.color;
              break;
            }
          }
        }
      }

      if (col.editor === "input") {
        col.formatter = (cell, formatterParams) => {
          let value = cell.getValue();
          doConditionalFormatting(cell, formatterParams);
          if (value === undefined) return "";
          return value;
        }
      }

      if (col.editor === "textarea" || col.editor === "codemirror" || (col.editor === false && col.formatter === "textarea") || (col.editor === "autocomplete")) {
        col.formatter = (cell, formatterParams) => {
          let value = cell.getValue();
          doConditionalFormatting(cell, formatterParams);
          if (value === undefined) return "";
          if (typeof value != "string") return value;
          let width = cell.getColumn().getWidth();
          let data = cell.getRow().getData();
          if (me.isJiraRow(data, jiraConfig, jiraAgileConfig)) {
            let arr = value.split("\n");
            if (arr.length >= 20) {
              value = `<noDivStyling/><div style="white-space:pre-wrap;overflow-wrap: break-all;word-wrap:break-all;word-break:break-all;overflow-x:auto;overflow-y:auto;height:250px;">${value}</div>`
              value = value.replace(/{noformat}([\s\S]*?){noformat}/gi, `<pre style="width:${width - 30}px">$1</pre>`);
              value = value.replaceAll(/^==/gm, `\\==`);
            }
          }
          value = MarkdownIt.render(value);
          if (value.startsWith("<noDivStyling/>")) {
            return `<div style="overflow-x: auto;width:${width - 8}px">${value}</div>`;
          } else {
            return `<div style="white-space:normal;word-wrap:break-word;margin-bottom:-12px;width:${width - 8}px">${value}</div>`;
          }
        }
        col.formatterClipboard = (cell, formatterParams) => {
          let h = cell.getRow().getCell(cell.getField())._cell.element;
          h = h.cloneNode(true);
          cell.getElement().style.backgroundColor = h.style.backgroundColor;
          cell.getElement().style.color = h.style.color;
          return h;
        }
        col.variableHeight = true;
        if (col.editor === "textarea" || col.editor === "codemirror") {
          col.editorParams = col.editorParams || {};
          col.editorParams.dsName = dsName;
          if (col.editor === "textarea") col.editor = MyTextArea; else col.editor = MyCodeMirror;
          let me2 = me;
          col.cellEditCancelled = (cell) => {
            if (!me2.cellImEditing) {
              console.log("Normalize, Inside second editcancelled..")
              cell.getRow().normalizeHeight();
            } else {
              console.log("Skipping normalize, Inside second editcancelled");
            }
          }
        }
      }

      if (col.editor === "autocomplete" && col.editorParams && col.editorParams.multiselect) {
        col.editor = MyAutoCompleter;
        if (!col.editorParams.verticalNavigation) col.editorParams.verticalNavigation = "table";
      } else if (col.editor === "autocomplete" && col.editorParams && !col.editorParams.multiselect) {
        col.editor = MySingleAutoCompleter;
        if (!col.editorParams.verticalNavigation) col.editorParams.verticalNavigation = "table";
      }
      if (col.editor === "date") {
        col.editor = DateEditor;
        col.editorParams = { format: "MM/DD/YYYY" };
      }
      columns.push(col);
    }

    if (getState().frozenCol) {
      let beforeFrozen = true;
      for (let i = 0; i < columns.length; i++) {
        let col = columns[i];
        if (beforeFrozen) col.frozen = true; else delete col.frozen;
        if (col.field === getState().frozenCol) beforeFrozen = false;
      }
    } else {
      for (let i = 0; i < columns.length; i++) {
        let col = columns[i];
        delete col.frozen;
      }
    }
    return columns;
  }

  function ajaxURLGenerator(url, config, params) {
    return url;
  }

  return {
    setColumnDefinitions,
    ajaxURLGenerator
  };
}
