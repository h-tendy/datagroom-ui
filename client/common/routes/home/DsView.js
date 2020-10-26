import React, { Component, ReactDOM } from 'react'
import { Route } from 'react-router-dom'
import { Row, Col, Button, Form } from 'react-bootstrap'
import { connect } from 'react-redux';
import { dsActions } from '../../actions/ds.actions';
import { dsConstants } from '../../constants';
import { Link } from 'react-router-dom'
//import 'react-tabulator/lib/styles.css'; // required styles
//import 'react-tabulator/lib/css/tabulator.css'; // theme
//import { ReactTabulator } from 'react-tabulator';
import MyTabulator from './MyTabulator';
import MyTextArea from './MyTextArea';
import MyCodeMirror from './MyCodeMirror';
import Select from 'react-select';
//import 'highlight.js/styles/vs.css'
//import 'highlight.js/styles/zenburn.css'
import 'highlight.js/styles/solarized-light.css'
import MyAutoCompleter from './MyAutoCompleter';
import MySingleAutoCompleter from './MySingleAutoCompleter';
import ColorPicker from './ColorPicker';
import Modal from './Modal';
import FilterControls from './FilterControls';
import QueryParsers from './QueryParsers';

//import '../../../../node_modules/react-tabulator/lib/styles.css'; // required styles
//import '../../../../node_modules/react-tabulator/lib/css/tabulator.css';
import './simpleStyles.css';
let MarkdownIt = new require('markdown-it')({
    linkify: true,
    html: true
}).use(require('markdown-it-bracketed-spans')).use(require('markdown-it-attrs')).use(require('markdown-it-container'), 'code').use(require('markdown-it-highlightjs'));

// From: https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender = MarkdownIt.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

MarkdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // If you are sure other plugins can't add `target` - drop check below
    var aIndex = tokens[idx].attrIndex('target');
  
    if (aIndex < 0) {
      tokens[idx].attrPush(['target', '_blank']); // add new attribute
    } else {
      tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
    }
  
    // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
};

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}

var socket = require('socket.io-client').connect(config.apiUrl);

class DsView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            firstTime: true,
            filterButtonText: 'Enable Filters',
            editingButtonText: 'Disable Editing',
            pageSize: 30,
            totalRecs: 0, 
            refresh: 0,
            initialHeaderFilter: [],
            initialSort: [],
            filterColumnAttrs: {},
            currentColumnAttrs: {}, // Unused, cleanup all uses of this one. 
            filter: '',
            frozenCol: "",
            showModal: false,
            modalTitle: "Title of modal",
            modalQuestion: "This is the modal question",
            modalCallback: null,

            chronologyDescending: false,
            singleClickEdit: false,
            showAllFilters: false,
            disableEditing: false,
            showColorPicker: false,
            colorPickerLeft: 0,
            colorPickerTop: 0,
            color: 0,
        };
        this.ref = null;
        
        this.timers = {};
        this.lockedByOthersCells = {};
        this.firstRenderCompleted = false;
        this.cellImEditing = null;

        this.renderComplete = this.renderComplete.bind(this);
        this.cellEditing = this.cellEditing.bind(this);
        this.cellEdited = this.cellEdited.bind(this);
        this.cellEditCancelled = this.cellEditCancelled.bind(this);
        this.cellEditCheck = this.cellEditCheck.bind(this);

        this.recordRef = this.recordRef.bind(this);
        this.downloadXlsx = this.downloadXlsx.bind(this);
        this.toggleFilters = this.toggleFilters.bind(this);
        this.toggleEditing = this.toggleEditing.bind(this);
        this.addRow = this.addRow.bind(this);
        this.deleteRowHandler = this.deleteRowHandler.bind(this);
        this.deleteAllRowsInViewQuestion = this.deleteAllRowsInViewQuestion.bind(this);
        this.deleteAllRowsInView = this.deleteAllRowsInView.bind(this);
        this.duplicateAndAddRowHandler = this.duplicateAndAddRowHandler.bind(this);
        this.toggleSingleFilter = this.toggleSingleFilter.bind(this);
        this.freezeColumn = this.freezeColumn.bind(this);
        this.unfreezeColumn = this.unfreezeColumn.bind(this);
        this.setFreezeColumn = this.setFreezeColumn.bind(this);
        this.pageSizeChange = this.pageSizeChange.bind(this);
        this.ajaxResponse = this.ajaxResponse.bind(this);
        this.ajaxURLGenerator = this.ajaxURLGenerator.bind(this);
        this.cellClickEvents = this.cellClickEvents.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);
        this.copyCellToClipboard = this.copyCellToClipboard.bind(this);
        this.pickFillColorHandler = this.pickFillColorHandler.bind(this);
        this.handleColorPickerClose = this.handleColorPickerClose.bind(this);
        this.handleColorPickerOnChangeComplete = this.handleColorPickerOnChangeComplete.bind(this);
        this.jiraRefreshHandler = this.jiraRefreshHandler.bind(this);
        this.jiraRefreshStatus = this.jiraRefreshStatus.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.processFilterChange = this.processFilterChange.bind(this);
        this.isKey = this.isKey.bind(this);
        this.hideColumn = this.hideColumn.bind(this);
        this.showAllCols = this.showAllCols.bind(this);
        this.hideColumnFromCell = this.hideColumnFromCell.bind(this);
        this.columnResized = this.columnResized.bind(this);
        this.columnVisibilityChanged = this.columnVisibilityChanged.bind(this);
        this.retainColumnAttrs = this.retainColumnAttrs.bind(this);
        this.applyFilterColumnAttrs = this.applyFilterColumnAttrs.bind(this);

        let chronologyDescendingFrmLocal = localStorage.getItem("chronologyDescending");
        chronologyDescendingFrmLocal = JSON.parse(chronologyDescendingFrmLocal);
        this.state.chronologyDescending = chronologyDescendingFrmLocal;
        let singleClickEditFrmLocal = localStorage.getItem("singleClickEdit");
        singleClickEditFrmLocal = JSON.parse(singleClickEditFrmLocal);
        this.state.singleClickEdit = singleClickEditFrmLocal;
        let showAllFiltersFrmLocal = localStorage.getItem("showAllFilters");
        showAllFiltersFrmLocal = JSON.parse(showAllFiltersFrmLocal);
        this.state.showAllFilters = showAllFiltersFrmLocal;
        let disableEditingFrmLocal = localStorage.getItem("disableEditing");
        disableEditingFrmLocal = JSON.parse(disableEditingFrmLocal);
        this.state.disableEditing = disableEditingFrmLocal;
    }
    componentDidMount () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        if ( !Object.keys(dsHome).length || !dsHome.dsViews || !dsHome.dsViews[dsView] ) {
            dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user)); 
        }
        let me = this;
        socket.on('connect', (data) => {
            socket.emit('Hello', { user: user.user});
        })
        socket.on('Hello', (helloObj) => {
            ;
        })
        socket.on('activeLocks', (activeLocks) => {
            activeLocks = JSON.parse(activeLocks);
            console.log("Active locks: ", activeLocks);
            let keys = Object.keys(activeLocks);
            for (let i = 0; i < keys.length; i++) {
                let _id = keys[i];
                let rows = me.ref.table.searchRows("_id", "=", _id);
                if (!rows.length) continue;
                console.log("Found row!");
                let fields = Object.keys(activeLocks[_id]);
                for (let j = 0; j < fields.length; j++) {
                    let field = fields[j];
                    console.log("Field is: ",field);
                    let cell = rows[0].getCell(field);
                    console.log("Cell is: ", cell);
                    activeLocks[_id][field] = cell;
                    if (!cell) continue;
                    if (me.cellImEditing === cell) {
                        console.log("Whoops, someone else got there first..");
                        cell.cancelEdit();
                    }
                    cell.getElement().style.backgroundColor = 'lightGray';
                }
            }
            this.lockedByOthersCells = activeLocks;
        })
        socket.on('locked', (lockedObj) => {
            console.log('Received locked: ', lockedObj);
            if (!me.ref || !me.ref.table) return;
            if (dsName === lockedObj.dsName) {
                let rows = me.ref.table.searchRows("_id", "=", lockedObj._id);
                // rows.length must be 1. 
                if (!rows.length) return;
                let cell = rows[0].getCell(lockedObj.field);
                if (!me.lockedByOthersCells[lockedObj._id]) {
                    me.lockedByOthersCells[lockedObj._id] = {}
                }
                me.lockedByOthersCells[lockedObj._id][lockedObj.field] = cell;
                if (me.cellImEditing === cell) {
                    console.log("Whoops, someone else got there first..");
                    cell.cancelEdit();
                }
                cell.getElement().style.backgroundColor = 'lightGray';
            }
        })
        socket.on('unlocked', (unlockedObj) => {
            try {
                if (!me.ref || !me.ref.table) return;
                if (dsName === unlockedObj.dsName && me.lockedByOthersCells[unlockedObj._id][unlockedObj.field]) {
                    let cell = me.lockedByOthersCells[unlockedObj._id][unlockedObj.field];
                    delete me.lockedByOthersCells[unlockedObj._id][unlockedObj.field];
                    if (unlockedObj.newVal) {
                        let update = { _id: unlockedObj._id };
                        update[unlockedObj.field] = unlockedObj.newVal;
                        console.log('Update: ', update);
                        me.ref.table.updateData([ update ]);
                    }
                    // Delete the 'lightGray', then restore correct formatting
                    cell.getElement().style.backgroundColor = '';
                    //Restore correctly.
                    let colDef = cell.getColumn().getDefinition();
                    console.log("colDef is: ", colDef);
                    colDef.formatter(cell, colDef.formatterParams);
                } else if (dsName === unlockedObj.dsName && unlockedObj.newVal) {
                    let rows = me.ref.table.searchRows("_id", "=", unlockedObj._id);
                    // rows.length must be 1. 
                    if (!rows.length) return;
                    let cell = rows[0].getCell(unlockedObj.field);
                    let update = { _id: unlockedObj._id };
                    update[unlockedObj.field] = unlockedObj.newVal;
                    console.log('Update: ', update);
                    me.ref.table.updateData([ update ]);
                }
            } catch (e) {}
            console.log('Received unlocked: ', unlockedObj);
        })
    }
    componentWillUnmount () {
        const { dispatch } = this.props;
        dispatch( { type: dsConstants.CLEAR_COLUMNS } );
    }

    renderComplete () {
        const { match } = this.props;
        let dsName = match.params.dsName; 

        //console.log("table data: ", this.ref.table.getData());

        //if (this.firstRenderCompleted) return;
        socket.emit('getActiveLocks', dsName);
        //this.firstRenderCompleted = true;
    }

    showAllCols () {
        let cols = this.ref.table.getColumns();
        for (let i = 0; i < cols.length; i++) {
            if (!cols[i].isVisible())
                cols[i].show();
        }
    }

    hideColumn (e, column) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        if (!this.isKey(column.getField()))
            column.hide();
    }

    hideColumnFromCell (e, cell) {
        let column = cell.getColumn();
        if (!this.isKey(column.getField()))
            column.hide();
    }

    columnResized (column) {
        let forField = this.state.currentColumnAttrs[column.getField()];
        if (!forField) forField = {};
        if (forField.width !== column.getWidth()) {
            let currentColumnAttrs = { ...this.state.currentColumnAttrs };
            forField.width = column.getWidth();
            currentColumnAttrs[column.getField()] = forField;
            this.setState({ currentColumnAttrs });
        }
    }

    columnVisibilityChanged (column, visible) {
        let forField = this.state.currentColumnAttrs[column.getField()];
        if (!forField) forField = {};
        if (forField.hidden !== !visible) {
            let currentColumnAttrs = { ...this.state.currentColumnAttrs };
            forField.hidden = !visible;
            currentColumnAttrs[column.getField()] = forField;
            this.setState({ currentColumnAttrs });
        }
    }

    isKey (field) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        //console.log("Field is: ", field);
        if (dsHome.dsViews[dsView].keys && dsHome.dsViews[dsView].keys.length) {
            for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
                let key = dsHome.dsViews[dsView].keys[i];
                //console.log("key is: ", key);
                if (field === key)
                    return true;
            }
        }
        return false;
    }

    toggleModal (confirmed) {
        this.state.modalCallback(confirmed);
        this.setState({ showModal: !this.state.showModal });
    }

    cellClickEvents (e, cell) {
        if (e.type === "dblclick" && !this.state.singleClickEdit && !this.state.disableEditing && this.cellEditCheckForConflicts(cell)) {
            // Force edit
            cell.edit(true);
        }
    }
    cellEditCheckForConflicts (cell) {
        try {
            let column = cell.getColumn().getField();
            let _id = cell.getRow().getData()['_id'];
            if (this.lockedByOthersCells[_id][column])
                return false;
        } catch (e) {}
        return true;
    }
    cellEditCheck (cell) {      
        if (!this.state.singleClickEdit)  return false;
        if (this.state.disableEditing) return false;
        return this.cellEditCheckForConflicts(cell);
    }

    cellEditCancelled (cell) {
        const { match } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let column = cell.getColumn().getField();
        let _id = cell.getRow().getData()['_id'];
        if (!_id) {
            return;
        }
        this.cellImEditing = null;
        let unlockReq = { _id, field: column, dsName, dsView }
        socket.emit('unlockReq', unlockReq);
        this.ref.table.element.focus({preventScroll: false});
    }

    cellEditing (cell) {
        const { match } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let column = cell.getColumn().getField();
        let _id = cell.getRow().getData()['_id'];
        if (!_id) {
            return;
        }
        this.cellImEditing = cell;
        let lockReq = { _id, field: column, dsName, dsView }
        socket.emit('lockReq', lockReq);
        //cell.__dg__prevBgColor = cell.getElement().style.backgroundColor;
        //cell.getElement().style.backgroundColor = cell.__dg__prevBgColor;
        //delete cell.__dg__prevBgColor;
        // If you have started editing some cell, don't fire this timer. 
        if (this.timers["post-cell-edited"]) {
            clearTimeout(this.timers["post-cell-edited"]);
            this.timers["post-cell-edited"] = null;
        }
    }

    toggleFilters () {
        const { dsHome, match } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        this.ref.table.clearHeaderFilter();
        let currentDefs = this.ref.table.getColumnDefinitions();
        //console.log("Current definitions: ", currentDefs);
        let newVal;
        for (let j = 0; j < currentDefs.length; j++) {
            newVal = currentDefs[j].headerFilter ? false : 'input';
            try {
                // If the headerFilter has to be set, then set it from the backend value. 
                if (newVal) {
                    if (dsHome.dsViews[dsView].columnAttrs[j].headerFilterType)
                        newVal = dsHome.dsViews[dsView].columnAttrs[j].headerFilterType;
                }
            } catch (e) {}
            currentDefs[j].headerFilter = newVal;
            //this.ref.table.updateColumnDefinition(currentDefs[j].field, {editor: newVal});
        }
        this.ref.table.setColumns(currentDefs);
        this.setState( { filterButtonText: newVal ? 'Disable Filtering' : 'Enable Filtering'} );
        //let row = this.ref.table.getRows();
        //console.log(row);
        //row.normalizeHeight();

        //this.ref.table.redraw(true);
    }

    toggleEditing () {
        const { dsHome, match } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let currentDefs = this.ref.table.getColumnDefinitions();
        //console.log("Current definitions: ", currentDefs);
        let newVal;
        for (let j = 0; j < currentDefs.length; j++) {
            newVal = currentDefs[j].editor ? false : 'input';
            currentDefs[j].editor = newVal;
            try {
                // If the editor has to be set, then set it from the backend value. 
                if (newVal) {
                    currentDefs[j].editor = dsHome.dsViews[dsView].columnAttrs[j].editor;
                    if (currentDefs[j].editor === 'textarea') {
                        currentDefs[j].editor = MyTextArea;
                    } else if (currentDefs[j].editor === 'codemirror') {
                        currentDefs[j].editor = MyCodeMirror;
                    }
                    console.log("Field: ", currentDefs[j].field, "editor: ", dsHome.dsViews[dsView].columnAttrs[j].editor);
                }
            } catch (e) {}
        //this.ref.table.updateColumnDefinition(currentDefs[j].field, {editor: newVal});
        }
        let initialHeaderFilter = this.ref.table.getHeaderFilters();
        this.ref.table.setColumns(currentDefs);
        this.setState( { editingButtonText: newVal ? 'Disable Editing' : 'Enable Editing', initialHeaderFilter, refresh: this.state.refresh + 1 } );
    }

    async addRow (e, cell, data) {
        const { dispatch, match, dsHome } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        if (!data) data = {};
        try {
            if (Object.keys(dsHome.dsRowAdds[dsView]).length) {
                console.log("A row add is in progress..");
                return;
            }
        } catch (e) {}
        // XXX: 20 is pagination size. Make it a constant. 
        //let row = await this.ref.table.addRow({}, false, 20);
        let row = await this.ref.table.addRow(data, true);
        console.log("Row is: ", row);
    }

    copyToClipboard () {
        // You have to also set 'clipboard' to true in table options.
        this.ref.table.copyToClipboard();
    }

    // https://stackoverflow.com/questions/34191780/javascript-copy-string-to-clipboard-as-text-html
    copyFormatted (html) {
        // Create container for the HTML
        var container = document.createElement('div')
        container.innerHTML = html
    
        // Hide element
        container.style.position = 'fixed'
        container.style.pointerEvents = 'none'
        container.style.opacity = 0
    
        // Detect all style sheets of the page
        var activeSheets = Array.prototype.slice.call(document.styleSheets)
        .filter(function (sheet) {
            return !sheet.disabled
        })
    
        // Mount the container to the DOM to make `contentWindow` available
        document.body.appendChild(container)
    
        // Copy to clipboard
        window.getSelection().removeAllRanges()    
        var range = document.createRange()
        range.selectNode(container)
        window.getSelection().addRange(range)
        document.execCommand('copy')
    
        for (var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = true
    
        document.execCommand('copy')
    
        for (var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = false
    
        // Remove the container
        document.body.removeChild(container)
    }

    copyCellToClipboard (e, cell) {
        let colDef = cell.getColumn().getDefinition();
        let html = colDef.formatter(cell, colDef.formatterParams);
        //this.copyFormatted(html);

        //let value = cell.getValue();
        //if (typeof value != "string") return value;
        //value = MarkdownIt.render(value);
        this.copyFormatted(`<div style="font-family:verdana; font-size:12px">${html}</div>`);

    }

    step1 () {
        const { match, dsHome } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        if ( !Object.keys(dsHome).length || !dsHome.dsViews || !dsHome.dsViews[dsView] ) {
            //dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user)); 
        }

        let s1 = '';
        try {
            if (dsHome.dsViews[dsView].columns) {
                //console.log("Column found!");
            }
        } catch (e) {}
        return s1;
    }
    recordRef (ref) {
        // setting state is causing grief to the Tabulator component. 
        //this.setState({ ref });
        this.ref = ref;
        return true;
    }

    downloadXlsx () {
        const { dispatch, match, user } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        // XXX: Doesn't work from the front end. 
        // this.ref.table.download("xlsx", "data.xlsx", { sheetName: "export" })

        dispatch(dsActions.downloadXlsx(dsName, dsView, user.user));
    }

    addRowStatus () {
        const { dispatch, match, dsHome } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let status = ''
        try {
            if (dsHome.dsRowAdds[dsView].status === 'filling') {
                return '';
            }
            if (dsHome.dsRowAdds[dsView].status === 'fail') { 
                status = 'New row add api failed';
            } else if (dsHome.dsRowAdds[dsView].serverStatus.status === 'fail') {
                status = 'Row addition failed, key might already be used. Try a different key.';
            } else if (dsHome.dsRowAdds[dsView].serverStatus.status === 'success') {
                console.log("Updating with: ", dsHome.dsRowAdds[dsView].serverStatus._id);
                dsHome.dsRowAdds[dsView].uiRow.update({_id: dsHome.dsRowAdds[dsView].serverStatus._id})
                dispatch({ type: dsConstants.CLEAR_ROW_ADD_TRACKER });
            }
        } catch (e) {}
        return <b style={{color: "red"}}> {status} </b>;
    }

    cellEditStatus () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let status = ''
        //console.log('In cellEditStatus');
        try {
            Object.entries(dsHome.dsEdits).map( (kv) => {
                let k = kv[0];
                if (dsHome.dsEdits[k].editStatus === 'done' && 
                    dsHome.dsEdits[k].serverStatus.status === 'fail' && 
                    dsHome.dsEdits[k].serverStatus.hasOwnProperty('value')) {
                    // set the cell's value from the server.
                    let update = { _id: k };
                    update[dsHome.dsEdits[k].serverStatus.column] = dsHome.dsEdits[k].serverStatus.value;
                    console.log('Update: ', update);
                    this.ref.table.updateData([ update ]);
                    status += `Update failed, new [key, value]: [${dsHome.dsEdits[k].serverStatus.column}, ${dsHome.dsEdits[k].serverStatus.value}] `

                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                } else if (dsHome.dsEdits[k].editStatus === 'done' && 
                    dsHome.dsEdits[k].serverStatus.status === 'fail' && 
                    dsHome.dsEdits[k].serverStatus.hasOwnProperty('error')) {
                    // when you are editing a key. You simply get an error. Restore old value. 
                    let update = { _id: k };
                    update[dsHome.dsEdits[k].editTracker.field] = dsHome.dsEdits[k].editTracker.oldVal;
                    this.ref.table.updateData([ update ]);
                    status += `Update failed (error: ${dsHome.dsEdits[k].serverStatus.error}), reverted [key, value]: [${dsHome.dsEdits[k].editTracker.field}, ${dsHome.dsEdits[k].editTracker.oldVal}]`

                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                } else if (dsHome.dsEdits[k].editStatus === 'done' && 
                    dsHome.dsEdits[k].serverStatus.status === 'success') {

                    // Release the lock and publish new value to everyone
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let newVal = dsHome.dsEdits[k].editTracker.newVal;
                    let unlockReq = { _id: k, field: column, dsName, dsView, newVal }
                    socket.emit('unlockReq', unlockReq);
                    dispatch({ type: dsConstants.EDIT_SINGLE_DELETE_TRACKER, _id: k })

                } else if (dsHome.dsEdits[k].editStatus === 'fail') {
                    let update = { _id: k };
                    update[dsHome.dsEdits[k].editTracker.field] = dsHome.dsEdits[k].editTracker.oldVal;
                    this.ref.table.updateData([ update ]);
                    status += `Update failed, reverted [key, value]: [${dsHome.dsEdits[k].editTracker.field}, ${dsHome.dsEdits[k].editTracker.oldVal}] `;

                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                }
                // Revert the value for other failures also. 
            })
        } catch (e) {}
        //console.log("Status: ", status);
        return <b style={{color: "red"}}> {status} </b>;
    }

    cellEdited (cell) {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        // When I'm using MyAutoCompleter, we have to explicitly adjust the 
        // height. But added it everywhere. 
        cell.getRow().normalizeHeight();
        // XXX: This below call makes you lose continuous editing. Maybe you can 
        // call this in a delayed fashion.
        if (this.timers["post-cell-edited"]) {
            clearTimeout(this.timers["post-cell-edited"]);
            this.timers["post-cell-edited"] = null;
        }
        this.timers["post-cell-edited"] = setTimeout(() => {
            //cell.getRow().normalizeHeight();
            this.ref.table.rowManager.adjustTableSize(false);
        }, 500);

        //This maybe too expensive? Not good because it loses scrolling position
        //this.ref.table.redraw();
        // This is the correct routine to call which doesn't lose your scrolling. 
        //this.ref.table.rowManager.adjustTableSize();

        let column = cell.getColumn().getField();
        let _id = cell.getRow().getData()['_id'];
        if (!_id) {
            let keyObj = {};
            console.log('Looks like new row edit... ');
            let { oldVal, newVal } = this.fixValueType(cell);
            if (dsHome.dsViews[dsView].keys && dsHome.dsViews[dsView].keys.length) {
                for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
                    let key = dsHome.dsViews[dsView].keys[i];
                    if (cell.getRow().getData()[key] == null || cell.getRow().getData()[key] === '') {
                        console.log('Not yet ready...');
                        return;
                    }
                    keyObj[key] = cell.getRow().getData()[key];
                }
            }
            let rowData = cell.getRow().getData();
            console.log('rowData: ', rowData);
            let uiRow = cell.getRow();
            dispatch(dsActions.insertOneDoc(dsName, dsView, user.user, keyObj, rowData, uiRow)); 
            return;
        }
        // Edit logic
        let { oldVal, newVal } = this.fixValueType(cell);

        let selectorObj = {};
        selectorObj["_id"] = _id;
        for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
            let key = dsHome.dsViews[dsView].keys[i];
            selectorObj[key] = cell.getRow().getData()[key];
        }
        selectorObj[column] = oldVal;

        let editObj = {};
        editObj[column] = newVal;
        dispatch(dsActions.editSingleAttribute(dsName, dsView, user.user, _id, column, oldVal, newVal, selectorObj, editObj));

    }
    
    fixValueType(cell) {
        let oldVal = cell.getOldValue();
        let typeOfOldVal = 'tbd';
        if (oldVal !== '')
            typeOfOldVal = typeof oldVal;
        console.log("Type of old val:", typeOfOldVal);
        console.log("oldvalue is: ", oldVal);
        //if (oldVal !== '' && !Number.isNaN(Number(oldVal))) oldVal = Number(oldVal);
        let newVal = cell.getValue();
        if (newVal !== '' && !Number.isNaN(Number(newVal)))
            newVal = Number(newVal);
        if (typeOfOldVal == 'string')
            newVal = newVal.toString();
        // XXX: Tabulator always sets the value to string. 
        // This fixes it correctly.
        cell.setValue(newVal);
        return { oldVal, newVal };
    }

    duplicateAndAddRowHandler (e, cell) {
        console.log("Duplicate and add row called..");
        let newData = JSON.parse(JSON.stringify(cell.getData()));
        delete newData._id;
        console.log("newData: ", newData);
        this.addRow(null, cell, newData);
        //cell.setValue("");
    }

    rowDeleteStatus () {
        const { dispatch, dsHome } = this.props;
        let status = ''
        try {
            Object.entries(dsHome.dsDeletes).map( (kv) => {
                let k = kv[0];
                if (dsHome.dsDeletes[k].deleteStatus === 'done' && 
                    dsHome.dsDeletes[k].serverStatus.status === 'fail') {
                    //this.ref.table.updateData([ update ]);
                    status += `Delete failed on server `
                } else if (dsHome.dsDeletes[k].deleteStatus === 'done' && 
                    dsHome.dsDeletes[k].serverStatus.status === 'success') {
                    let row = dsHome.dsDeletes[k].deleteTracker.row;
                    row.delete();
                    dispatch({ type: dsConstants.DELETE_SINGLE_DELETE_TRACKER, _id: k })
                } else if (dsHome.dsDeletes[k].deleteStatus === 'fail') {
                    status += `Delete API failed`;
                }
            })
        } catch (e) {}
        //console.log("Status: ", status);
        return <b style={{color: "red"}}> {status} </b>;
    }

    deleteRowHandler (e, cell) {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        console.log("Delete row handler called...");
        let _id = cell.getRow().getData()['_id'];
        if (!_id) {
            cell.getRow().delete();
            return;
        }
        // Delete logic
        dispatch(dsActions.deleteOneDoc(dsName, dsView, user.user, _id, cell.getRow()));
    }

    deleteAllRowsStatus () {
        const { dispatch, dsHome } = this.props;
        let status = ''
        try {
            Object.entries(dsHome.dsDeletes).map( (kv) => {
                let k = kv[0];
                if (dsHome.dsDeletes[k].deleteStatus === 'done' && 
                    dsHome.dsDeletes[k].serverStatus.status === 'fail') {
                    status += `Delete failed on server `
                } else if (dsHome.dsDeletes[k].deleteStatus === 'done' && 
                    dsHome.dsDeletes[k].serverStatus.status === 'success') {
                    let rows = dsHome.dsDeletes[k].deleteTracker.rows;
                    for (let i = 0; i < rows.length; i++)
                        rows[i].delete();
                    dispatch({ type: dsConstants.DELETE_MANY_DELETE_TRACKER, _id: k })
                } else if (dsHome.dsDeletes[k].deleteStatus === 'fail') {
                    status += `Delete API failed`;
                }
            })
        } catch (e) {}
        return <b style={{color: "red"}}> {status} </b>;
    }

    deleteAllRowsInView (confirmed) {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        console.log("Confirmed is: ", confirmed);
        if (confirmed) {
            let rows = this.ref.table.getRows();
            let objects = [];
            console.log("Will now delete Rows: ", rows);
            for (let i = 0; i < rows.length; i++) {
                let _id = rows[i].getData()['_id'];
                if (_id)
                    objects.push(_id);
            }
            dispatch(dsActions.deleteManyDocs(dsName, dsView, user.user, objects, rows));
        }
        this.setState({ showModal: !this.state.showModal });
    }

    deleteAllRowsInViewQuestion () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let rows = this.ref.table.getRows();
        this.setState({ modalTitle: "Delete all rows in view?", 
                        modalQuestion: `This will delete ${rows.length} rows. Please confirm. Undoing support is not yet available!`,
                        modalCallback: this.deleteAllRowsInView,
                        showModal: !this.state.showModal });
    }


    jiraRefreshStatus () {
        const { dispatch, dsHome } = this.props;
        if (dsHome && dsHome.dsJiraRefresh && dsHome.dsJiraRefresh.status === 'done') {
            this.setState({ refresh: this.state.refresh + 1 });
            dispatch({ type: dsConstants.JIRA_REFRESH_DELETE_TRACKER })
        }

    }

    jiraRefreshHandler () {
        const { dispatch, match, user } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let initialHeaderFilter = this.ref.table.getHeaderFilters();
        this.setState({initialHeaderFilter});
        dispatch(dsActions.refreshJira(dsName, dsView, user.user));
    }

    setFreezeColumn (e, column, freeze) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let currentDefs = this.ref.table.getColumnDefinitions();
        // Last column freezing or unfreezing is no-op in our design. 
        if (currentDefs[currentDefs.length - 1].field === column.getField()) 
            return;

        // Preserve the filters first. 
        let initialHeaderFilter = this.ref.table.getHeaderFilters();
        this.setState({initialHeaderFilter});

        if (freeze)
            this.setState({frozenCol: column.getField(), refresh: this.state.refresh + 1});
        else 
            this.setState({frozenCol: "", refresh: this.state.refresh + 1});
        // Doesn't do the right thing. 
        // https://github.com/olifolkerd/tabulator/issues/2868
        /*
        let newVal;
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                currentDefs[j].frozen = freeze;
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {frozen: freeze});
                break;
            }
        } */
    }
    freezeColumn (e, column) {
        this.setFreezeColumn(e, column, true);
    }
    unfreezeColumn (e, column) {
        this.setFreezeColumn(e, column, false)
    }

    toggleSingleFilter (e, column) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let currentDefs = this.ref.table.getColumnDefinitions();
        let newVal;
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                newVal = currentDefs[j].headerFilter ? false : 'input';
                try {
                    // If the headerFilter has to be set, then set it from the backend value. 
                    if (newVal) {
                        if (dsHome.dsViews[dsView].columnAttrs[j].headerFilterType)
                            newVal = dsHome.dsViews[dsView].columnAttrs[j].headerFilterType;
                        /*
                        if (currentDefs[j].field === "SlNo") {
                            currentDefs[j].headerFilter = 'number';
                            newVal = 'number'
                        }*/
                    }
                } catch (e) {}
                currentDefs[j].headerFilter = newVal;
                // Comment this line and uncomment couple of lines below to use setCOlumns
                // if you don't like the header row width. 
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {headerFilter: newVal});
            }
        }
        // uncomment this and comment updatecolumnDefinition above if you don't like header width. 
        //this.ref.table.setColumns(currentDefs);
    }

    handleColorPickerClose () {
        this.setState({ showColorPicker: false });
    }
    handleColorPickerOnChangeComplete (color) {
        console.log("Got back color: ", color);
        this.setState({ showColorPicker: true, color: color.hex });
    }
    pickFillColorHandler (e, cell) {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        console.log("pickFillColorHandler called: ", e);
        let _id = cell.getRow().getData()['_id'];
        this.setState({ showColorPicker: true, colorPickerLeft: e.pageX, colorPickerTop: e.pageY });
    }

    
    setColumnDefinitions () {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let headerMenuWithoutHide = [
            {
                label:"Toggle Filters",
                action: this.toggleSingleFilter
            },
            {
                label:"Freeze",
                action: this.freezeColumn
            },
            {
                label:"Unfreeze",
                action: this.unfreezeColumn
            }
        ];
        let headerMenuWithHide = [
            {
                label:"Toggle Filters",
                action: this.toggleSingleFilter
            },
            {
                label:"Freeze",
                action: this.freezeColumn
            },
            {
                label:"Unfreeze",
                action: this.unfreezeColumn
            },
            {
                label:"<i class='fas fa-eye-slash'></i> Hide Column",
                action: this.hideColumn
            },            
            {
                label:"<i class='fas fa-eye'></i> Unhide all Columns",
                action: this.showAllCols
            },            
        ];
        let cellContextMenu = [
            {
                label:"Duplicate row & add...",
                action: this.duplicateAndAddRowHandler
            },
            {
                label:"Add empty row...",
                action: this.addRow
            },
            {
                label:"Copy cell to clipboard...",
                action: this.copyCellToClipboard
            },
            {
                label:"<i class='fas fa-eye-slash'></i> Hide Column",
                action: this.hideColumnFromCell
            },            
            {
                label:"<i class='fas fa-eye'></i> Unhide all Columns",
                action: this.showAllCols
            },            
            {
                separator: true
            },
            /*
            {
                label:"Pick fill color...",
                action: this.pickFillColorHandler
            },
            {
                separator: true
            },*/
            {
                label:"Delete all rows in view...",
                action: this.deleteAllRowsInViewQuestion
            },
            {
                label:"Delete row...",
                action: this.deleteRowHandler
            },
        ];        
        let columns = [];
        for (let i = 0; i < dsHome.dsViews[dsView].columnAttrs.length; i++) {
            let col = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].columnAttrs[i]));
            if (!this.isKey(col.field)) {
                col.headerMenu = headerMenuWithHide;
            } else {
                col.headerMenu = headerMenuWithoutHide;
                col.titleFormatter = (t, titleFormatterParams) => {
                    return `<u>${t.getValue()}</u>`;
                }
            }
            col.contextMenu = cellContextMenu;
            col.editable = this.cellEditCheck;

            if (this.state.showAllFilters) {
                col.headerFilter = "input";
                if (col.headerFilterType)
                    col.headerFilter = col.headerFilterType;
            }
            // Do in a function so that you can attach to all formatters.
            function doConditionalFormatting (cell, formatterParams) {
                if (formatterParams && formatterParams.conditionalFormatting) {
                    let rowData = cell.getRow().getData();
                    for (let i = 0; i < formatterParams.conditionalExprs.length; i++) {
                        // XXX: Add more error checking here
                        let exprStr = formatterParams.conditionalExprs[i].split('->')[0].trim();
                        let expr = QueryParsers.parseExpr(exprStr);
                        if (QueryParsers.evalExpr(expr, rowData)) {
                            let values = formatterParams.conditionalExprs[i].split('->')[1].trim();
                            values = JSON.parse(values);
                            if (values.backgroundColor) {
                                cell.getElement().style.backgroundColor = values.backgroundColor;
                            }
                            if (values.color) {
                                cell.getElement().style.color = values.color;
                            }
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
                /* // This loses conditional formatting!
                col.formatterClipboard = (cell, formatterParams) => {
                    let value = cell.getValue();
                    doConditionalFormatting(cell, formatterParams);
                    if (value === undefined) return "";
                    return value;
                } */
            }
            if (col.editor === "textarea" || col.editor === "codemirror" || (col.editor === false && col.formatter === "textarea") || (col.editor === "autocomplete")) {
                // By default, all textareas support markdown now. 
                col.formatter = (cell, formatterParams) => {
                    let value = cell.getValue();
                    doConditionalFormatting(cell, formatterParams);
                    if (value === undefined) return "";
                    if (typeof value != "string") return value;
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;margin-bottom:-12px;">${value}</div>`;
                }
                /* // This loses conditional formatting!
                col.formatterClipboard = (cell, formatterParams) => {
                    let value = cell.getValue();
                    console.log("Coming to formatterClipboard");
                    doConditionalFormatting(cell, formatterParams);
                    if (value === undefined) return "";
                    if (typeof value != "string") return value;
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;">${value}</div>`;
                }*/
                col.variableHeight = true;
                if (col.editor === "textarea" || col.editor === "codemirror") {
                    if (col.editor === "textarea")
                        col.editor = MyTextArea;
                    else 
                        col.editor = MyCodeMirror;
                    col.cellEditCancelled = (cell) => {
                        console.log("Inside second editcancelled..")
                        cell.getRow().normalizeHeight();
                    }
                }
            }

            if (col.editor === "autocomplete" && col.editorParams.multiselect) {
                col.editor = MyAutoCompleter;
                if (!col.editorParams.verticalNavigation) {
                    col.editorParams.verticalNavigation = "table"
                }
            } else if (col.editor === "autocomplete" && !col.editorParams.multiselect) {
                // To support conditional values, I'm using a copy. 
                col.editor = MySingleAutoCompleter;
                if (!col.editorParams.verticalNavigation) {
                    col.editorParams.verticalNavigation = "table"
                }
            }
            columns.push(col);
        }
        // One more iteration to deal with frozen columns. 
        if (this.state.frozenCol) {
            let beforeFrozen = true;
            for (let i = 0; i < columns.length; i++) {
                let col = columns[i];
                if (beforeFrozen)
                    col.frozen = true;
                else
                    delete col.frozen;
                if (col.field === this.state.frozenCol) {
                    beforeFrozen = false;
                }
            }
        } else {
            for (let i = 0; i < columns.length; i++) {
                let col = columns[i];
                delete col.frozen;
            }
        }
        return columns;
    }

    ajaxResponse (url, params, response) {
        //console.log('ajaxResponse: ', response);
        this.setState({ totalRecs: response.total});
        return response; 
    }

    // From tabulator
    generateParamsList (data, prefix) {
        var self = this,
        output = [];
    
        prefix = prefix || "";
    
        if ( Array.isArray(data) ) {
            data.forEach(function(item, i){
                output = output.concat(self.generateParamsList(item, prefix ? prefix + "[" + i + "]" : i));
            });
        }else if (typeof data === "object"){
            for (var key in data){
                output = output.concat(self.generateParamsList(data[key], prefix ? prefix + "[" + key + "]" : key));
            }
        }else{
            output.push({key:prefix, value:data});
        }
    
        return output;    
    }

    serializeParams (params) {
        var output = this.generateParamsList(params),
        encoded = [];
    
        output.forEach(function(item){
            encoded.push(encodeURIComponent(item.key) + "=" + encodeURIComponent(item.value));
        });
    
        return encoded.join("&");    
    }

    ajaxURLGenerator (url, config, params) {
        if(url){
            if(params && Object.keys(params).length) {
                // Pick this from a checkbox. 
                params.chronology = this.state.chronologyDescending ? 'desc' : 'asc';
                if(!config.method || config.method.toLowerCase() == "get"){
                    config.method = "get";
    
                    url += (url.includes("?") ? "&" : "?") + this.serializeParams(params);
                }
            }
        }
        return url;    
    }

    step2 () {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let s2 = '';
        let fixedHeight = false, vh = undefined;
        try {
            fixedHeight = dsHome.dsViews[dsView].otherTableAttrs.fixedHeight;
        } catch (e) {};
        if (fixedHeight) {
            vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            if (vh) { 
                vh -= 50;
                vh = vh + "px"; 
            } else {
                vh = undefined;
            }
        }
        if (dsHome && dsHome.dsViews && dsHome.dsViews[dsView] && dsHome.dsViews[dsView].columns) {
            let columns = this.setColumnDefinitions();
            s2 = <Row>
                        <div>
                            <MyTabulator
                                columns={columns}
                                data={[]}
                                options={{
                                    ajaxURL: `${config.apiUrl}/ds/view/${this.props.match.params.dsName}`,
                                    ajaxURLGenerator:this.ajaxURLGenerator,
                                    chronology: this.state.chronologyDescending,
                                    forceRefresh: this.state.refresh,
                                    //ajaxProgressiveLoad:"load",
                                    //ajaxProgressiveLoadDelay: 200,
                                    pagination:"remote",
                                    paginationDataSent: {
                                        page: 'page',
                                        size: 'per_page' // change 'size' param to 'per_page'
                                    },
                                    paginationDataReceived: {
                                        last_page: 'total_pages'
                                    },
                                    current_page: 1,
                                    paginationSize: this.state.pageSize,
                                    paginationSizeSelector: [5, 10, 25, 30, 50, 100, 500, true],
                                    ajaxResponse: this.ajaxResponse,
                                    ajaxError: function (error) {
                                        console.log('ajaxError', error);
                                    },
                                    //movableColumns: true,
                                    //keybindings: {"navRight": 39, "navLeft": 37},
                                    cellEdited: this.cellEdited,
                                    cellEditing: this.cellEditing,
                                    cellEditCancelled: this.cellEditCancelled,
                                    cellClick: this.cellClickEvents,
                                    cellDblClick: this.cellClickEvents,
                                    index: "_id",
                                    ajaxSorting: true,
                                    ajaxFiltering: true,
                                    initialHeaderFilter: this.state.initialHeaderFilter,
                                    initialSort: JSON.parse(JSON.stringify(this.state.initialSort)), // it'll mess up the state otherwise!
                                    //columnResized: this.columnResized,
                                    //columnVisibilityChanged: this.columnVisibilityChanged,
                                    height: vh,
                                    //virtualDomBuffer: 500,
                                    //selectable: true,
                                    //persistence: { columns: true },
                                    //persistenceID: `${dsName}_${dsView}`,
                                    clipboard: true,
                                    rowFormatter: (row) => {
                                        if(!row.getData()._id){
                                            row.getElement().style.backgroundColor = "lightGray";
                                        } else {
                                            row.getElement().style.backgroundColor = "white";
                                        }  
                                    },
                                    cellMouseEnter: (e, cell) => {
                                        if (cell.getElement().style.backgroundColor !== "#fcfcfc") 
                                            cell.__dg__prevBgColor = cell.getElement().style.backgroundColor;
                                        //cell.getElement().style.backgroundColor = "#fcfcfc";
                                    },
                                    cellMouseLeave: (e, cell) => {
                                        //cell.getElement().style.backgroundColor = cell.__dg__prevBgColor;
                                        delete cell.__dg__prevBgColor;
                                    },
                                    renderComplete: this.renderComplete
                                }}
                                innerref={this.recordRef}
                                />
                        </div>
                    </Row>            
        }
        return s2;
    }

    processFilterChange (filter) {
        const { match, history, dsHome } = this.props;
        let dsView = match.params.dsView;
        let newUrl = match.url;
        
        let urlWords = match.url.split('/');
        //console.log('in processFilterChange: ', filter);
        //console.log('urlWords: ', urlWords);
        newUrl = '/' + urlWords[1] + '/' + urlWords[2] + '/' + urlWords[3];
        if (filter) newUrl += '/' + filter;
        let initialHeaderFilter = [], initialSort = [], filterColumnAttrs = {};
        if (filter) {
            try {
                // Tabulator messes up the hdrSorters, so we give it a copy. 
                initialHeaderFilter = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].filters[filter].hdrFilters));
                initialSort = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].filters[filter].hdrSorters));
                if (dsHome.dsViews[dsView].filters[filter].filterColumnAttrs) {
                    filterColumnAttrs = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].filters[filter].filterColumnAttrs));
                }
                if (JSON.stringify(this.state.initialHeaderFilter) !== JSON.stringify(initialHeaderFilter) || JSON.stringify(this.state.initialSort) !== JSON.stringify(initialSort) || JSON.stringify(this.state.filterColumnAttrs) !== JSON.stringify(filterColumnAttrs)) {
                    this.setState({ showAllFilters: true, filter, initialHeaderFilter, initialSort, filterColumnAttrs, refresh: this.state.refresh + 1});
                    console.log('moving to :', newUrl);
                    history.push(newUrl);
                }
            } catch (e) { 
                console.log("I am getting an exception...: ", e)
                // At least note it down... 
                if (this.state.filter !== filter) {
                    this.setState({ filter });
                    history.push(newUrl);
                }
            }
        } else {
            initialHeaderFilter = [];
            initialSort = [];
            filterColumnAttrs = {};
            if (this.state.initialHeaderFilter.length === 0 && this.state.initialSort.length === 0 && Object.keys(this.state.filterColumnAttrs).length === 0) {
                console.log("should not be coming here");
            } else /*if (this.state.initialHeaderFilter !== initialHeaderFilter || this.state.initialSort !== initialSort)*/ {
                // Don't set showAllFilters to true here. This is the fix for
                // navigating correctly when you click on 'show filters' checkbox. 
                this.setState({ /*showAllFilters: true,*/ filter, initialHeaderFilter, initialSort, filterColumnAttrs, refresh: this.state.refresh + 1});
            }
            //console.log("match:", match);
            //console.log("location:", this.props.location)
            if (newUrl !== this.props.location.pathname)
                history.push(newUrl);
        }

        this.applyFilterColumnAttrs();
    }

    applyFilterColumnAttrs () {
        try {
            console.log("Applying for: ", this.state.filter);
            // process filterColumnAttrs
            let cols = this.ref.table.getColumns();
            if (Object.keys(this.state.filterColumnAttrs)) {
                for (let field in this.state.filterColumnAttrs) {
                    let fieldAttrs = this.state.filterColumnAttrs[field];
                    for (let i = 0; i < cols.length; i++) {
                        if (cols[i].getField() === field) {
                            if (fieldAttrs.hidden && cols[i].isVisible()) {
                                cols[i].hide();
                            }
                            if (cols[i].getWidth() !== fieldAttrs.width) {
                                cols[i].setWidth(fieldAttrs.width);
                            }
                        }
                    }
                }
            } else {
                // When you clear a filter, filterColumnAttrs will be empty object.
                // Then, you have to unhide everything. 
                this.showAllCols();
            }
        } catch (e) { console.log("Exception while applying for: ", this.state.filter, e) }
    }

    // Unused. 
    retainColumnAttrs () {
        try {
            let cols = this.ref.table.getColumns();
            for (let field in this.state.currentColumnAttrs) {
                let fieldAttrs = this.state.currentColumnAttrs[field];
                for (let i = 0; i < cols.length; i++) {
                    if (cols[i].getField() === field) {
                        if (fieldAttrs.hidden && cols[i].isVisible()) {
                            cols[i].hide();
                        }
                        if (cols[i].getWidth() !== fieldAttrs.width) {
                            cols[i].setWidth(fieldAttrs.width);
                        }
                    }
                }
            }
        } catch (e) {}
    }

    fixOneTimeLocalStorage () {
        const { match } = this.props;
        // We don't want to store editor and headerFilter status in localStorage
        // Only width is what we care about. Storing too much causes inconsistencies
        // in initialization of the tabulator table. 
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let lsKey = `tabulator-${dsName}_${dsView}-columns`;
        let lsValue = localStorage.getItem(lsKey);
        lsValue = JSON.parse(lsValue);
        if (this.state.firstTime && lsValue && lsValue.length) {
            this.setState({ firstTime: false });
            lsValue.forEach(element => {
                delete element.editor;
                delete element.headerFilter;
                delete element.editorParams;
                delete element.headerMenu;
                delete element.contextMenu;
            });
            localStorage.setItem(lsKey, JSON.stringify(lsValue));
        }
    }
    pageSizeChange (value) {
        if (value && value.value) {
            console.log("Setting pageSize to: ", value.value);
            this.setState({pageSize: value.value});
        } else {
            console.log("Setting pageSize to: ", 20);
            this.setState({pageSize: 20});
        }
    }

    render () {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let me = this; 
        this.fixOneTimeLocalStorage();
        let jiraRefreshButton = "";
        console.log("In DsView render..");
        try {
            if (dsHome.dsViews[dsView].jiraConfig.jira) {
                //jiraRefreshButton = <Button size="sm" onClick={this.jiraRefreshHandler}> Refresh Jira </Button>
                jiraRefreshButton = <> | <button className="btn btn-link" onClick={this.jiraRefreshHandler}> <i class='fas fa-redo'></i> Refresh Jira </button> </>
                if (dsHome && dsHome.dsJiraRefresh && dsHome.dsJiraRefresh.status === 'refreshing')
                    //jiraRefreshButton = <Button size="sm" onClick={this.jiraRefreshHandler}> Refresh Jira </Button>
                    jiraRefreshButton = <> | <button className="btn btn-link" onClick={this.jiraRefreshHandler} disabled> <i class='fas fa-redo'></i> Refresh Jira </button> </>
            }
        } catch (e) {};
        let dsDescription = ""; 
        try {
            let value = MarkdownIt.render(dsHome.dsViews[dsView].dsDescription.dsDescription);
            dsDescription = <div dangerouslySetInnerHTML={{ __html: value }}/>
        } catch (e) {};
        this.processFilterChange(this.state.filter);
        //this.retainColumnAttrs();
        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                        <h3 style={{ 'float': 'center' }}> {match.params.dsName}</h3>
                    </Col>
                </Row>
                <Row>
                    <Col md={10} sm={10} xs={10}> 
                        {dsDescription}
                    </Col>
                </Row>
                {this.step1()}
                <br/>
                <Row>
                    <button className="btn btn-link" onClick={this.downloadXlsx}> <i class='fas fa-file-export'></i> Get xlsx </button> | 
                    <button className="btn btn-link" onClick={this.copyToClipboard}> <i class='fas fa-clipboard'></i> Copy-to-clipboard </button> | 
                    <button className="btn btn-link" onClick={this.addRow}> <i class='fas fa-plus'></i> Add Row </button>
                    {/* 
                    <Button size="sm" onClick={this.downloadXlsx}> Get xlsx </Button>
                    <Button size="sm" onClick={this.toggleFilters}> {this.state.filterButtonText} </Button>
                    <Button size="sm" onClick={this.toggleEditing}> {this.state.editingButtonText} </Button>
                    <Button size="sm" onClick={this.copyToClipboard}> Copy-to-clipbard </Button>
                    <Button size="sm" onClick={this.addRow}> Add Row </Button>
                    */}
                    {jiraRefreshButton}
                    {this.cellEditStatus()}
                    {this.addRowStatus()}
                    {this.rowDeleteStatus()}
                    {this.deleteAllRowsStatus()}
                    {this.jiraRefreshStatus()}
                </Row>
                {/* 
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <Form.Check inline type="checkbox" label="&nbsp;Desc order" checked={this.state.chronologyDescending} onChange={(event) => {
                                    let checked = event.target.checked;
                                    let initialHeaderFilter = me.ref.table.getHeaderFilters();
                                    me.setState({chronologyDescending: checked, initialHeaderFilter});
                                    localStorage.setItem("chronologyDescending", JSON.stringify(checked));
                                }}/>
                    </Col>
                    <Col md={2} sm={2} xs={2}> 
                    <Form.Check inline type="checkbox" label="&nbsp;1-click editing" checked={this.state.singleClickEdit} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({singleClickEdit: checked});
                                    localStorage.setItem("singleClickEdit", JSON.stringify(checked));
                                }}/>
                    </Col>
                    <Col md={2} sm={2} xs={2}> 
                    <Form.Check inline type="checkbox" label="&nbsp;Show filters" checked={this.state.showAllFilters} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({showAllFilters: checked});
                                    localStorage.setItem("showAllFilters", JSON.stringify(checked));
                                    me.toggleFilters();
                                }}/>
                    </Col>
                    <Col md={3} sm={3} xs={3}> 
                    <Form.Check inline type="checkbox" label="&nbsp;Disable Editing" checked={this.state.disableEditing} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({disableEditing: checked});
                                    localStorage.setItem("disableEditing", JSON.stringify(checked));
                                    me.toggleEditing();
                                }}/>
                    </Col>
                </Row>
                */}
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <input type="checkbox" checked={this.state.chronologyDescending} onChange={(event) => {
                                    let checked = event.target.checked;
                                    let initialHeaderFilter = me.ref.table.getHeaderFilters();
                                    me.setState({chronologyDescending: checked, initialHeaderFilter});
                                    localStorage.setItem("chronologyDescending", JSON.stringify(checked));
                                }}/>
                    &nbsp; Desc order <i class='fas fa-level-down-alt'></i>&nbsp;&nbsp;| &nbsp;

                    <input type="checkbox" label="&nbsp;1-click editing" checked={this.state.singleClickEdit} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({singleClickEdit: checked});
                                    localStorage.setItem("singleClickEdit", JSON.stringify(checked));
                                }}/>
                    &nbsp; 1-click editing <i class='fas fa-bolt'></i>&nbsp;&nbsp;| &nbsp;

                    <input type="checkbox" label="&nbsp;Show filters" checked={this.state.showAllFilters} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({showAllFilters: checked});
                                    localStorage.setItem("showAllFilters", JSON.stringify(checked));
                                    me.toggleFilters();
                                }}/>
                    &nbsp; Show filters <i class='fas fa-filter'></i>&nbsp;&nbsp;| &nbsp;

                    <input type="checkbox" label="&nbsp;Disable Editing" checked={this.state.disableEditing} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({disableEditing: checked});
                                    localStorage.setItem("disableEditing", JSON.stringify(checked));
                                    me.toggleEditing();
                                }}/>
                    &nbsp; Disable Editing <i class='fas fa-ban'></i>&nbsp;&nbsp;

                    </Col>
                </Row>

                {
                    <Route exact path={`${match.path}/:filter`} render={(props) => {
                        let filter = props.match.params.filter;
                        if (filter !== me.state.filter) {
                            me.processFilterChange(filter);
                        }
                    }} />
                }
                <FilterControls show={me.state.showAllFilters} dsName={dsName} dsView={dsView} tableRef={me.ref} onFilterChange={me.processFilterChange} defaultValue={me.state.filter}/>    
                <br/>            
                <Row>
                <Col md={6} sm={6} xs={6}> 
                    <b><i class='fas fa-clone'></i> Total records: {this.state.totalRecs} | </b>
                    <Link to={`/dsEditLog/${match.params.dsName}`} target="_blank"><i class='fas fa-file-alt'></i> <b>Edit-log</b></Link> |&nbsp;
                    <Link to={`/dsViewEdit/${match.params.dsName}/${match.params.dsView}`} target="_blank"><i class='fas fa-edit'></i> <b>Edit-view</b></Link>
                </Col>
                </Row>
                {this.step2()}
                <Modal show={this.state.showModal}
                    onClose={this.toggleModal} title={this.state.modalTitle}>
                    {this.state.modalQuestion}
                </Modal>
                {this.state.showColorPicker ? <ColorPicker left={this.state.colorPickerLeft} top={this.state.colorPickerTop} color={this.state.color} onChangeComplete={this.handleColorPickerOnChangeComplete} handleClose={this.handleColorPickerClose}/>: ''}
            </div>
        );
    }

}

function mapStateToProps(state) {
    const { user } = state.authentication;
    const { home } = state;
    const { dsHome } = state;
    return {
        user,
        home,
        dsHome
    }
}

const cDsView = connect(mapStateToProps)(DsView);


export default cDsView