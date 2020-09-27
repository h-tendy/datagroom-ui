import React, { Component } from 'react'
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
import Select from 'react-select';
//import 'highlight.js/styles/vs.css'
//import 'highlight.js/styles/zenburn.css'
import 'highlight.js/styles/solarized-light.css'
import MyAutoCompleter from './MyAutoCompleter';
import MySingleAutoCompleter from './MySingleAutoCompleter';
import ColorPicker from './ColorPicker';

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
            frozenCol: "",

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

        let chronologyDescendingFrmLocal = localStorage.getItem("chronologyDescending");
        chronologyDescendingFrmLocal = JSON.parse(chronologyDescendingFrmLocal);
        this.state.chronologyDescending = chronologyDescendingFrmLocal;
        let singleClickEditFrmLocal = localStorage.getItem("singleClickEdit");
        singleClickEditFrmLocal = JSON.parse(singleClickEditFrmLocal);
        this.state.singleClickEdit = singleClickEditFrmLocal;
        /*
        let showAllFiltersFrmLocal = localStorage.getItem("showAllFilters");
        showAllFiltersFrmLocal = JSON.parse(showAllFiltersFrmLocal);
        this.state.showAllFilters = showAllFiltersFrmLocal;
        let disableEditingFrmLocal = localStorage.getItem("disableEditing");
        disableEditingFrmLocal = JSON.parse(disableEditingFrmLocal);
        this.state.disableEditing = disableEditingFrmLocal;
        */
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
            currentDefs[j].headerFilter = newVal;
            try {
                // If the headerFilter has to be set, then set it from the backend value. 
                if (newVal) {
                    if (dsHome.dsViews[dsView].columnAttrs[j].headerFilterType)
                        newVal = dsHome.dsViews[dsView].columnAttrs[j].headerFilterType;
                }
            } catch (e) {}
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
                    }
                    console.log("Field: ", currentDefs[j].field, "editor: ", dsHome.dsViews[dsView].columnAttrs[j].editor);
                }
            } catch (e) {}
        //this.ref.table.updateColumnDefinition(currentDefs[j].field, {editor: newVal});
        }
        this.ref.table.setColumns(currentDefs);
        this.setState( { editingButtonText: newVal ? 'Disable Editing' : 'Enable Editing'} );
    }

    async addRow (e, data) {
        const { dispatch, match, dsHome } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        console.log("Add row called..: ", data);
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
                    status += `Update failed, reverted [key, value]: [${dsHome.dsEdits[k].editTracker.field}, ${dsHome.dsEdits[k].editTracker.oldVal}]`

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
        this.ref.table.rowManager.adjustTableSize(false);
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
        this.addRow(null, newData);
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
                currentDefs[j].headerFilter = newVal;
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

        let headerMenu = [
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
                label:"Delete row...",
                action: this.deleteRowHandler
            },
        ];        
        let columns = [];
        for (let i = 0; i < dsHome.dsViews[dsView].columnAttrs.length; i++) {
            let col = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].columnAttrs[i]));
            col.headerMenu = headerMenu;
            col.contextMenu = cellContextMenu;
            col.editable = this.cellEditCheck;

            if (this.state.showAllFilters) {
                col.headerFilter = "input";
            }

            if (col.editor === "textarea" || (col.editor === false && col.formatter === "textarea") || (col.editor === "autocomplete")) {
                // By default, all textareas support markdown now. 
                col.formatter = (cell, formatterParams) => {
                    //cell.getElement().style.backgroundColor = 'lightpink';
                    //cell.getElement().style.color = 'black';
                    let value = cell.getValue();
                    if (typeof value != "string") return value;
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;margin-bottom:-12px">${value}</div>`;
                }
                col.formatterClipboard = (cell, formatterParams) => {
                    //cell.getElement().style.backgroundColor = 'lightpink';
                    //cell.getElement().style.color = 'black';
                    let value = cell.getValue();
                    if (value === undefined) return "";
                    if (typeof value != "string") return value;
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;">${value}</div>`;
                }
                col.variableHeight = true;
                if (col.editor === "textarea") {
                    // Set the editor to a fixed one for special keys. 
                    col.editor = MyTextArea;
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
            // XXX: No need for any conditional formatting for now. 
            if (col.field === "Severity") {
                col.formatter = (cell, formatterParams) => {
                    let value = cell.getValue();
                    if(value && value.indexOf("Critical") > 0){
                        cell.getElement().style.backgroundColor = 'red';
                        value = "<span style='font-weight:bold;'>" + value + "</span>";
                    } else {
                        cell.getElement().style.backgroundColor = ''
                    }
                    return value;
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
                                    paginationSizeSelector: [10, 25, 50, 100, 500, true],
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
                                    //height: "500px",
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
                                        //console.log("Enter-1, prev: ", cell.__dg__prevBgColor);
                                        //console.log("Enter-1, cur: ", cell.getElement().style.backgroundColor);
                                        if (cell.getElement().style.backgroundColor !== "#fcfcfc") 
                                            cell.__dg__prevBgColor = cell.getElement().style.backgroundColor;
                                        cell.getElement().style.backgroundColor = "#fcfcfc";
                                        //console.log("Enter-2, prev: ", cell.__dg__prevBgColor);
                                        //console.log("Enter-2, cur: ", cell.getElement().style.backgroundColor);
                                    },
                                    cellMouseLeave: (e, cell) => {
                                        //console.log("Leave-1, prev: ", cell.__dg__prevBgColor);
                                        //console.log("Leave-1, cur: ", cell.getElement().style.backgroundColor);
                                        cell.getElement().style.backgroundColor = cell.__dg__prevBgColor;
                                        delete cell.__dg__prevBgColor;
                                        //console.log("Leave-2, prev: ", cell.__dg__prevBgColor);
                                        //console.log("Leave-2, cur: ", cell.getElement().style.backgroundColor);
                                    },
                                    renderComplete: this.renderComplete
                                    //rowContextMenu: [{ label: "Duplicate & Add", action: (e, row)=>{ e.preventDefault() }}, { label: "Delete row", action: (e, row) => { e.preventDefault() } }]
                                }}
                                innerref={this.recordRef}
                                />
                        </div>
                    </Row>            
        }
        return s2;
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
        let dsView = match.params.dsView;
        let me = this; 
        this.fixOneTimeLocalStorage();
        let jiraRefreshButton = "";

        try {
            if (dsHome.dsViews[dsView].jiraConfig.jira) {
                jiraRefreshButton = <Button size="sm" onClick={this.jiraRefreshHandler}> Refresh Jira </Button>
                if (dsHome && dsHome.dsJiraRefresh && dsHome.dsJiraRefresh.status === 'refreshing')
                    jiraRefreshButton = <Button size="sm" onClick={this.jiraRefreshHandler} disabled> Refresh Jira </Button>
            }
        } catch (e) {};

        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                        <h4 style={{ 'float': 'center' }}> {match.params.dsName}</h4>
                    </Col>
                </Row>
                {this.step1()}
                <br/>
                <Row>
                    <Button size="sm" onClick={this.downloadXlsx}> Get xlsx </Button>
                    {/* 
                    <Button size="sm" onClick={this.toggleFilters}> {this.state.filterButtonText} </Button>
                    <Button size="sm" onClick={this.toggleEditing}> {this.state.editingButtonText} </Button> */}
                    <Button size="sm" onClick={this.copyToClipboard}> Copy-to-clipbard </Button>
                    <Button size="sm" onClick={this.addRow}> Add Row </Button>
                    {jiraRefreshButton}
                    {this.cellEditStatus()}
                    {this.addRowStatus()}
                    {this.rowDeleteStatus()}
                    {this.jiraRefreshStatus()}
                </Row>
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
                <Row>
                <Col md={6} sm={6} xs={6}> 
                    <b>Total records: {this.state.totalRecs} | </b>
                    <Link to={`/dsEditLog/${match.params.dsName}`} target="_blank"><b>Edit-log</b></Link> |&nbsp;
                    <Link to={`/dsViewEdit/${match.params.dsName}/${match.params.dsView}`} target="_blank"><b>Edit-view</b></Link>
                </Col>
                </Row>
                {this.step2()}
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