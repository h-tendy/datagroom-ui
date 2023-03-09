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
import MyModalCodeMirror from './MyModalCodeMirror';
import DateEditor from "react-tabulator/lib/editors/DateEditor";
import Select from 'react-select';
//import 'highlight.js/styles/vs.css'
//import 'highlight.js/styles/zenburn.css'
import 'highlight.js/styles/solarized-light.css'
import MyAutoCompleter from './MyAutoCompleter';
import MySingleAutoCompleter from './MySingleAutoCompleter';
import ColorPicker from './ColorPicker';
import Modal from './Modal';
import ModalEditor from './ModalEditor';
import FilterControls from './FilterControls';
import QueryParsers from './QueryParsers';
import "reveal.js/dist/reveal.css";
//import "reveal.js/dist/theme/white.css";
import './rjs_white.css';
import JiraForm from './jiraForm.js'
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm'

//import '../../../../node_modules/react-tabulator/lib/styles.css'; // required styles
//import '../../../../node_modules/react-tabulator/lib/css/tabulator.css';
import './simpleStyles.css';
import markdownItMermaid from "@datatraccorporation/markdown-it-mermaid";
import { dsService } from '../../services';
let MarkdownIt = new require('markdown-it')({
    linkify: true,
    html: true
}).use(require('markdown-it-bracketed-spans')).use(require('markdown-it-attrs')).use(require('markdown-it-container'), 'code').use(require('markdown-it-container'), 'indent1').use(require('markdown-it-container'), 'indent2').use(require('markdown-it-container'), 'indent3').use(require('markdown-it-highlightjs')).use(markdownItMermaid).use(require('markdown-it-plantuml'), {imageFormat: 'png'}).use(require('markdown-it-container'), 'slide').use(require('markdown-it-fancy-lists').markdownItFancyListPlugin);


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

//TODO: should come from backend
const jiraCustomFieldMapping = {
    'Story Points': "customfield_11890"
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
            modalQuestion: "",
            modalCallback: null,
            modalStatus: '',
            modalCancel: 'Cancel',
            modalOk: 'Do It!',
            toggleModalOnClose: true,
            grayOutModalButtons: false,

            showSecondaryModal: false,
            secondaryModalTitle: "Title of modal",
            secondaryModalQuestion: "",
            secondaryModalCallback: null,
            secondaryModalStatus: '',
            secondaryModalCancel: 'Cancel',
            secondaryModalOk: 'Do It!',

            modalEditorOk: 'Done',
            modalEditorCancel: 'Cancel',
            modalEditorTitle: 'Edit cell', 
            modalEditorText: '',
            modalEditorCallback: null,
            showModalEditor: false,


            chronologyDescending: false,
            singleClickEdit: false,
            showAllFilters: false,
            disableEditing: false,
            showColorPicker: false,
            colorPickerLeft: 0,
            colorPickerTop: 0,
            color: 0,

            connectedState: false,
        };
        this.ref = null;
        
        this.timers = {};
        this.lockedByOthersCells = {};
        this.firstRenderCompleted = false;
        this.cellImEditing = null;
        this.mouseDownOnHtmlLink = false;
        this.mouseDownOnBadgeCopyIcon = false;
        this.reqCount = 0;

        this.jiraFormData = {
            Project: "",
            JIRA_AGILE_LABEL: "None",
            Type: "Epic",
            summary: "",
            description: ""
        }

        this.applyHtmlLinkAndBadgeClickHandlers = this.applyHtmlLinkAndBadgeClickHandlers.bind(this);
        this.renderComplete = this.renderComplete.bind(this);
        this.cellEditing = this.cellEditing.bind(this);
        this.cellEdited = this.cellEdited.bind(this);
        this.cellEditCancelled = this.cellEditCancelled.bind(this);
        this.cellEditCheck = this.cellEditCheck.bind(this);
        this.cellForceEditTrigger = this.cellForceEditTrigger.bind(this);
        this.fixImgSizeForClipboard = this.fixImgSizeForClipboard.bind(this);
        this.copyFormatted = this.copyFormatted.bind(this);

        this.startPreso = this.startPreso.bind(this);
        this.myCopyToClipboard = this.myCopyToClipboard.bind(this);
        this.recordRef = this.recordRef.bind(this);
        this.downloadXlsx = this.downloadXlsx.bind(this);
        this.toggleFilters = this.toggleFilters.bind(this);
        this.toggleEditing = this.toggleEditing.bind(this);
        this.addRow = this.addRow.bind(this);
        this.deleteRowHandler = this.deleteRowHandler.bind(this);
        this.deleteRowQuestion = this.deleteRowQuestion.bind(this);
        this.deleteAllRowsInViewQuestion = this.deleteAllRowsInViewQuestion.bind(this);
        this.deleteAllRowsInView = this.deleteAllRowsInView.bind(this);
        this.deleteAllRowsInQuery = this.deleteAllRowsInQuery.bind(this);
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
        this.secondaryToggleModal = this.secondaryToggleModal.bind(this)
        this.toggleModalEditor = this.toggleModalEditor.bind(this);
        this.processFilterChange = this.processFilterChange.bind(this);
        this.isKey = this.isKey.bind(this);
        this.hideColumn = this.hideColumn.bind(this);
        this.showAllCols = this.showAllCols.bind(this);
        this.hideColumnFromCell = this.hideColumnFromCell.bind(this);
        this.columnResized = this.columnResized.bind(this);
        this.columnVisibilityChanged = this.columnVisibilityChanged.bind(this);
        this.retainColumnAttrs = this.retainColumnAttrs.bind(this);
        this.applyFilterColumnAttrs = this.applyFilterColumnAttrs.bind(this);
        this.normalizeAllImgRows = this.normalizeAllImgRows.bind(this);
        this.applyHighlightJsBadge = this.applyHighlightJsBadge.bind(this);
        this.displayConnectedStatus = this.displayConnectedStatus.bind(this);

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


        this.convertToJiraRow = this.convertToJiraRow.bind(this)
        this.handleJiraFormChange = this.handleJiraFormChange.bind(this)
        this.submitJiraFormChange = this.submitJiraFormChange.bind(this)
        this.fillLocalStorageItemData = this.fillLocalStorageItemData.bind(this)
        this.addJiraRow = this.addJiraRow.bind(this)
        this.formFinalJiraFormData = this.formFinalJiraFormData.bind(this)
    }
    componentDidMount () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        if ( !Object.keys(dsHome).length || !dsHome.dsViews || !dsHome.dsViews[dsView] ) {
            dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user));
            dispatch(dsActions.getDefaultTypeFieldsAndValues(dsName, dsView, user.user)); 
        }
        let me = this;
        socket.on('connect', (data) => {
            socket.emit('Hello', { user: user.user});
            socket.emit('getActiveLocks', dsName);
            me.setState({connectedState: true});
        })
        socket.on('disconnect', (data) => {
            me.setState({connectedState: false});
        })
        socket.on('Hello', (helloObj) => {
            ;
        })
        socket.on('activeLocks', (activeLocks) => {
            me.setState({connectedState: true});
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
            let adjustTableHeight = false;
            try {
                if (!me.ref || !me.ref.table) return;
                if (dsName === unlockedObj.dsName && me.lockedByOthersCells[unlockedObj._id][unlockedObj.field]) {
                    let cell = me.lockedByOthersCells[unlockedObj._id][unlockedObj.field];
                    delete me.lockedByOthersCells[unlockedObj._id][unlockedObj.field];
                    if (unlockedObj.newVal !== undefined && unlockedObj.newVal !== null) {
                        let update = { _id: unlockedObj._id };
                        update[unlockedObj.field] = unlockedObj.newVal;
                        //console.log('Update1: ', update);
                        me.ref.table.updateData([ update ]);
                        adjustTableHeight = true;
                    }
                    // Delete the 'lightGray', then restore correct formatting
                    cell.getElement().style.backgroundColor = '';
                    //Restore correctly.
                    let colDef = cell.getColumn().getDefinition();
                    //console.log("colDef is: ", colDef);
                    colDef.formatter(cell, colDef.formatterParams);
                } else if (dsName === unlockedObj.dsName && unlockedObj.newVal) {
                    let rows = me.ref.table.searchRows("_id", "=", unlockedObj._id);
                    // rows.length must be 1. 
                    if (!rows.length) return;
                    let cell = rows[0].getCell(unlockedObj.field);
                    let update = { _id: unlockedObj._id };
                    update[unlockedObj.field] = unlockedObj.newVal;
                    //console.log('Update2: ', update);
                    me.ref.table.updateData([ update ]);
                    adjustTableHeight = true;
                }
            } catch (e) {}
            if (adjustTableHeight && !me.cellImEditing) {
                if (me.timers["post-cell-edited"]) {
                    clearTimeout(me.timers["post-cell-edited"]);
                    me.timers["post-cell-edited"] = null;
                }
                me.timers["post-cell-edited"] = setTimeout(() => {
                    if (!me.cellImEditing) {
                        //cell.getRow().normalizeHeight();
                        console.log("Doing adjusttablesize (unlockReq)... ");
                        me.ref.table.rowManager.adjustTableSize(false);
                        me.normalizeAllImgRows();
                        me.applyHighlightJsBadge();
                    } else {
                        console.log("Skipping adjusttablesie (unlockReq)... ");
                    }
                }, 500);                    
            }
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
        this.normalizeAllImgRows();
        // add HighlightJS-badge
        this.applyHighlightJsBadge();
    }

    // Since we generate html after editing, we need to attach
    // the handlers again. 
    applyHtmlLinkAndBadgeClickHandlers() {
        let me = this;
        let splElements = document.getElementById("tabulator").getElementsByTagName('a');
        for(var i = 0, len = splElements.length; i < len; i++) {
            splElements[i].onclick = function (e) {
                me.mouseDownOnHtmlLink = true;
                // Caution: This is a must, otherwise you are getting the click after returning to the tab!
                e.stopPropagation();
                // Caution: To clear this out after a second to ensure that the next click is honored properly. 
                setTimeout(() => me.mouseDownOnHtmlLink = false, 1000);
                return true;
            }
        }
        // This querySelectorAll is borrowed from highlightjs-badge.js code
        splElements = document.getElementById("tabulator").querySelectorAll(".code-badge-copy-icon");
        for(i = 0, len = splElements.length; i < len; i++) {
            // Have to setup for 'focus' event because that fires first! And
            // tabulator already has this setup on the cell.
            splElements[i].setAttribute("tabindex", 0);
            splElements[i].addEventListener("focus", 
                function(e) {
                    let clickedEl = e.srcElement;
                    console.log(`Classlist is: ${clickedEl.classList}`);
                    if (clickedEl.classList.contains("code-badge-copy-icon")) {    
                        me.mouseDownOnBadgeCopyIcon = true;
                        // Caution: To clear this out after a second to ensure that the next click is honored properly. 
                        setTimeout(() => me.mouseDownOnBadgeCopyIcon = false, 1000);
                        return true;
                    }
                });
        }
    }
    applyHighlightJsBadge() {
        let me = this;
        if (this.timers["applyHighlightJsBadge"]) {
            clearTimeout(this.timers["applyHighlightJsBadge"]);
            this.timers["applyHighlightJsBadge"] = null;
        }
        this.timers["applyHighlightJsBadge"] = setTimeout(() => {
            window.highlightJsBadge();
            this.applyHtmlLinkAndBadgeClickHandlers();
        }, 1000);
    }

    fixImgSizeForClipboard(output) {

        let imgList = document.querySelectorAll("img");
        let imgSizes = {};
        for (let i = 0; i < imgList.length; i++) {
            //console.log(`imgList[${i}]: `, imgList[i], imgList[i].width, imgList[i].height, imgList[i].naturalWidth, imgList[i].naturalHeight, imgList[i].getAttribute("src"));
            let img = {};
            img.src = imgList[i].getAttribute("src");
            img.width = imgList[i].width;
            img.height = imgList[i].height;
            imgSizes[img.src] = img;
        }
        let e = [...output.matchAll(/<img src="(.*?)"/gi)];
        for (let i = 0; i < e.length; i++) {
            let key = e[i][1];
            if (!imgSizes[key]) continue;
            if (/data:image/.test(key)) continue;
            let str = `<img src="${key}" alt="${key}" width=".*" height=".*"`;
            let rep = `<img src="${key}" alt="${key}" width=${imgSizes[key].width} height=${imgSizes[key].height}`;
            output = output.replace(new RegExp(str), rep);
        }
        output = output.replaceAll('<img src="/attachments/', `<img src="${window.location.origin}/attachments/`);
        return output;
    }

    normalizeAllImgRows() {
        let me = this;
        if (this.timers["normalizeAllImgRows"]) {
            clearInterval(this.timers["normalizeAllImgRows"]);
            this.timers["normalizeAllImgRows"] = null;
        }
        let extraIters = 0;
        this.timers["normalizeAllImgRows"] = setInterval(function () {
            //console.log("normalizeAllImgRows periodic fn...:", extraIters);
            if (document.readyState === 'complete') {
                let imgList = document.querySelectorAll("img");
                let allImgsRead = true;
                for (let i = 0; i < imgList.length; i++) {
                    //console.log(`imgList[${i}]: `, imgList[i].complete, imgList[i].naturalHeight);
                    if (!(imgList[i].complete /*&& imgList[i].naturalHeight !== 0*/)) {
                        allImgsRead = false;
                        extraIters = 0;
                        break;
                    }
                }
                if (allImgsRead) {
                    // Basically, give it 600 ms before the new image is fetching and
                    // allImgsRead is false...
                    if (extraIters === 2) {
                        if (imgList.length && !me.cellImEditing) {
                            let rows = me.ref.table.getRows();
                            for (let i = 0; i < rows.length; i++) {
                                rows[i].normalizeHeight();
                            }
                            //console.log("Adjusting table size now.");
                            me.ref.table.rowManager.adjustTableSize(false);
                        } else {
                            console.log("Skipping normalize as there are no images or some editing in progress...");
                        }
                    }
                    if (extraIters >= 10) {
                        //console.log("Cancelling timer after extraIters!");
                        extraIters = 0;
                        clearInterval(me.timers["normalizeAllImgRows"]);
                        me.timers["normalizeAllImgRows"] = null;
                    }
                    extraIters++;
                }
            }
        }, 300);
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

    toggleModal(confirmed, toggleModal) {
        this.state.modalCallback(confirmed);
        if (toggleModal != false) {
            this.setState({ showModal: !this.state.showModal });
        } else {
            // If not toggling the modal, on any click just gray out the buttons to disable subsequent click
            if (confirmed)
                this.setState({ grayOutModalButtons: true })
        }
    }
    secondaryToggleModal(confirmed) {
        this.state.secondaryModalCallback(confirmed);
        this.setState({ showSecondaryModal: !this.state.showSecondaryModal, grayOutModalButtons: false });
    }
    toggleModalEditor (confirmed, value) {
        this.state.modalEditorCallback(confirmed, value);
        this.setState({ showModalEditor: !this.state.showModalEditor });
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
        if (this.mouseDownOnHtmlLink || this.mouseDownOnBadgeCopyIcon) {
            return false;
        }
        return true;
    }
    cellEditCheck (cell) {      
        if (!this.state.singleClickEdit)  return false;
        if (this.state.disableEditing) return false;
        if (!this.state.connectedState) return false;
        return this.cellEditCheckForConflicts(cell);
    }
    cellForceEditTrigger (cell) {
        console.log("In cellForceEditTrigger");
        if (!this.state.singleClickEdit)  return false;
        if (this.state.disableEditing) return false;
        if (!this.state.connectedState) return false;
        let noConcurrentEdits = this.cellEditCheckForConflicts(cell);
        if (noConcurrentEdits) {
            setImmediate(() => {
                cell.edit(true);
                if (true) {
                    /*
                    let self = this, curValue = cell.getValue();
                    this.setState({ modalEditorText: curValue,
                                    modalEditorCallback: (confirmed, value) => {
                                        self.setState({ showModalEditor: false });
                                        if (confirmed) {
                                            console.log("Value is: ", value);
                                            cell.setValue(value);
                                        } else {
                                            cell.setValue(curValue);
                                        }
                                        //self.cellEdited(cell);
                                    },
                                    showModalEditor: true });
                    
                    this.cellEditing(cell);
                    return false;
                    */
                }
            });
        }        
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
        let me = this;
        if (this.cellImEditing === cell) {
            this.cellImEditing = null;
        } else {
            console.log("Not nullifying cellImEditing as it is not me!");
        }
        let unlockReq = { _id, field: column, dsName, dsView }
        socket.emit('unlockReq', unlockReq);
        if (this.timers["post-cell-edited"]) {
            clearTimeout(this.timers["post-cell-edited"]);
            this.timers["post-cell-edited"] = null;
        }
        this.timers["post-cell-edited"] = setTimeout(() => {
            if (!me.cellImEditing) {
                //cell.getRow().normalizeHeight();
                console.log("Doing adjusttablesize (cellEditCancelled)... ");
                this.ref.table.rowManager.adjustTableSize(false);
                this.normalizeAllImgRows();
                this.applyHighlightJsBadge();
            } else {
                console.log("Skipping adjusttablesize (cellEditCancelled)...");
            }
        }, 500);
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
        
        /*
        {
            let self = this, curValue = cell.getValue();
            this.setState({ modalEditorText: curValue,
                            modalEditorCallback: (confirmed, value) => {
                                self.setState({ showModalEditor: false });
                                if (confirmed) {
                                    console.log("Value is: ", value);
                                    cell.setValue(value);
                                } else {
                                    cell.setValue(curValue);
                                }
                                //self.cellEdited(cell);
                            },
                            showModalEditor: true });
        } */
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
                    } else if (currentDefs[j].editor === 'date') {
                        currentDefs[j].editor = DateEditor;
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

    async addRow (e, cell, data, pos) {
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
        let rowIdx = null;
        if (cell) {
            let _id = cell.getRow().getData()['_id'];
            rowIdx = _id;
        }
        if (pos === undefined || pos === null)
            pos = true;
        let row = await this.ref.table.addRow(data, pos, rowIdx);
        console.log("Row is: ", row);
    }

    startPreso () {
        let slideFound = false;
        let sectionHtml = "";
        let slideList = document.querySelectorAll(".slide");
        for (let i = 0; i < slideList.length; i++) {
            let slide = slideList[i];
            slideFound = true;
            sectionHtml += `<section class="top">${slide.innerHTML}</section>`;
        }
        if (!slideFound) return;

        sectionHtml = sectionHtml.replace(/<pre class="code-badge-pre"[\s\S]*?(<code [\s\S]*?<\/code>)<\/pre>/gi, '<pre>$1</pre>');
        localStorage.setItem('revealjsSections', sectionHtml);
        window.open('/revealjs', '_blank');
    }

    // The procedure we do in copyFormatted preserves all the styling! 
    // Thus, we will use the same html generation function, but copy it 
    // to clipboard with the tweaks as in copyFormatted. 
    // Ideally, the html for each cell should be copied from it's innerHTML. 
    // That will preserve the dynamically generated images like plantuml. See 
    // the copyCellToClipboard method. Since we don't have a hook, we are settling
    // for now. Only plantuml images don't appear in table copy. 
    // Now fixed. Setting colVisProp to "clipboard" will call the correct 
    // formatter in which we clone and use the resolved images! See 
    // col.formatterClipboard function below!
    myCopyToClipboard () {
        let visible = true, style = true, colVisProp = "clipboard", 
            config = null;
        let html = this.ref.table.modules.export.getHtml(visible, style, config, colVisProp);
        this.copyFormatted(null, html);
    }

    copyToClipboard () {
        // You have to also set 'clipboard' to true in table options.
        //this.ref.table.copyToClipboard();
        this.myCopyToClipboard();
    }

    // https://stackoverflow.com/questions/34191780/javascript-copy-string-to-clipboard-as-text-html
    copyFormatted (element, html) {
        // Create container for the HTML
        var container = document.createElement('div')
        // XXX: Try to see if you can get the html from the element. But this
        // didn't do the job. Also messed up the styling it seems. Background color is lost etc. 
        if (element) html = element.innerHTML;
        html = this.fixImgSizeForClipboard(html);
        // To replace the markup due to the highlightjs badges. 
        // The regex arrived by looking at the generated markup 
        // and some clever regex as usual. 
        // This mostly is needed when html comes from innerHTML!
        html = html.replace(/<pre class="code-badge-pre"[\s\S]*?(<code [\s\S]*?<\/code>)<\/pre>/gi, '<pre>$1</pre>');

        html = html.replace(/<code class="hljs">/gi, '<code class="hljs" style="background-color:white; font-size:12px">');
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
        //console.log(`ActiveSheets: `, activeSheets);
    
        // Mount the container to the DOM to make `contentWindow` available
        document.body.appendChild(container)
    
        // Copy to clipboard
        window.getSelection().removeAllRanges()    
        var range = document.createRange()
        range.selectNode(container)
        window.getSelection().addRange(range)
        document.execCommand('copy')
    
        
        for (var i = 0; i < activeSheets.length; i++) {
            //if (activeSheets[i].title === "highlightJsBadge" || /bootstrap|datagroom/.test(activeSheets[i].href))
            if (!/static\/css/.test(activeSheets[i].href))
                activeSheets[i].disabled = true
        }
        
        document.execCommand('copy')
    
        
        for (var i = 0; i < activeSheets.length; i++) {
            //if (activeSheets[i].title === "highlightJsBadge" || /bootstrap|datagroom/.test(activeSheets[i].href))
            if (!/static\/css/.test(activeSheets[i].href))
                activeSheets[i].disabled = false

        }
        
        // Remove the container
        document.body.removeChild(container)
    }

    copyFormattedBetter (container) {
        // Copy to clipboard
        window.getSelection().removeAllRanges()    
        var range = document.createRange()
        range.selectNode(container)
        window.getSelection().addRange(range)
        document.execCommand('copy')    
        window.getSelection().removeAllRanges();    
    }


    copyCellToClipboard (e, cell) {
        let colDef = cell.getColumn().getDefinition();
        let html = colDef.formatter(cell, colDef.formatterParams);
        //this.copyFormatted(html);

        // Now use the innerHTML! 
        this.copyFormatted(/*cell.getElement()*/ null, `<div style="font-family:verdana; font-size:12px; background-color: white">${cell.getElement().innerHTML}</div>`);

        //this.copyFormattedBetter(cell.getElement());
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
        let modalStatus = this.state.modalStatus;
        let showModal = false;
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
                    modalStatus += `Update <b style="color:red">failed</b>, [key, RejectedValue]: [${dsHome.dsEdits[k].serverStatus.column}, ${dsHome.dsEdits[k].editTracker.newVal}]<br/><br/>`
                    showModal = true;
                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                    dispatch({ type: dsConstants.EDIT_SINGLE_DELETE_TRACKER, _id: k })
                } else if (dsHome.dsEdits[k].editStatus === 'done' && 
                    dsHome.dsEdits[k].serverStatus.status === 'fail' && 
                    dsHome.dsEdits[k].serverStatus.hasOwnProperty('error')) {
                    // when you are editing a key. You simply get an error. Restore old value. 
                    let update = { _id: k };
                    update[dsHome.dsEdits[k].editTracker.field] = dsHome.dsEdits[k].editTracker.oldVal;
                    this.ref.table.updateData([ update ]);
                    modalStatus += `Update <b style="color:red">failed</b><br/> <b style="color:red">Error: ${dsHome.dsEdits[k].serverStatus.error})</b> <br/> Reverted [key, RejectedValue]: [${dsHome.dsEdits[k].editTracker.field}, ${dsHome.dsEdits[k].editTracker.newVal}]<br/><br/>`

                    showModal = true;
                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                    dispatch({ type: dsConstants.EDIT_SINGLE_DELETE_TRACKER, _id: k })
                } else if (dsHome.dsEdits[k].editStatus === 'done' &&
                    dsHome.dsEdits[k].serverStatus.status === 'success' &&
                    dsHome.dsEdits[k].serverStatus.hasOwnProperty('record')) {

                    let updatedRec = dsHome.dsEdits[k].serverStatus.record
                    let update = {
                        _id: k,
                        ...updatedRec
                    }
                    this.ref.table.updateData([update]);
                    showModal = false;
                    // Release the lock and publish new value to everyone
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let newVal = dsHome.dsEdits[k].editTracker.newVal;
                    let unlockReq = { _id: k, field: column, dsName, dsView, newVal }
                    socket.emit('unlockReq', unlockReq);
                    dispatch({ type: dsConstants.EDIT_SINGLE_DELETE_TRACKER, _id: k })

                } else if (dsHome.dsEdits[k].editStatus === 'done' && 
                    dsHome.dsEdits[k].serverStatus.status === 'success') {

                    showModal = false;
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
                    modalStatus += `Update <b style="color:red">failed</b>, reverted [key, RejectedValue]: [${dsHome.dsEdits[k].editTracker.field}, ${dsHome.dsEdits[k].editTracker.newVal}]<br/><br/>`;
                    showModal = true;
                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                    dispatch({ type: dsConstants.EDIT_SINGLE_DELETE_TRACKER, _id: k })
                } else if (dsHome.dsEdits[k].editStatus === 'done' &&
                    dsHome.dsEdits[k].serverStatus.status === 'silentFail') {
                    let update = { _id: k };
                    update[dsHome.dsEdits[k].editTracker.field] = dsHome.dsEdits[k].editTracker.oldVal;
                    this.ref.table.updateData([update]);
                    // Release the lock
                    this.cellImEditing = null;
                    let column = dsHome.dsEdits[k].editTracker.field;
                    let unlockReq = { _id: k, field: column, dsName, dsView }
                    socket.emit('unlockReq', unlockReq);
                    dispatch({ type: dsConstants.EDIT_SINGLE_DELETE_TRACKER, _id: k })
                }
                // Revert the value for other failures also. 
            })
        } catch (e) {}
        //console.log("Status: ", status);
        if (showModal /* && !this.state.showModal*/) {
            let self = this;
            let modalQuestion = modalStatus ? <div dangerouslySetInnerHTML={{__html: modalStatus}} /> : <div dangerouslySetInnerHTML={{__html: '<b style="color:green">Edit Success</b>'}} />;
            this.setState({ modalTitle: "Edit Status", 
                            modalQuestion: modalQuestion,
                            modalStatus: modalStatus,
                            modalOk: "Dismiss",
                            modalCallback: (confirmed) => {self.setState({showModal: false, modalQuestion: '', modalStatus: ''})},
                            showModal: true });
        }
        return <b style={{color: "red"}}> {''} </b>;
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
            this.normalizeAllImgRows();
            this.applyHighlightJsBadge();
        }, 500);

        //This maybe too expensive? Not good because it loses scrolling position
        //this.ref.table.redraw();
        // This is the correct routine to call which doesn't lose your scrolling. 
        //this.ref.table.rowManager.adjustTableSize();
        //this.normalizeAllImgRows();
        //this.applyHighlightJsBadge();


        let column = cell.getColumn().getField();
        let _id = cell.getRow().getData()['_id'];
        if (!_id) {
            let keyObj = {};
            console.log('Looks like new row edit... ');
            let { oldVal, newVal } = this.fixValueType(cell, column, dsHome, dsView);
            if (dsHome.dsViews[dsView].keys && dsHome.dsViews[dsView].keys.length) {
                let atLeastOneKeyNotEmpty = false;
                for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
                    let key = dsHome.dsViews[dsView].keys[i];
                    if (cell.getRow().getData()[key]) {
                        atLeastOneKeyNotEmpty = true;
                    }
                    keyObj[key] = cell.getRow().getData()[key];
                }
                if (!atLeastOneKeyNotEmpty) {
                    console.log("Not ready, all keys empty");
                    return;
                }
            }
            let rowData = cell.getRow().getData();
            console.log('rowData: ', rowData);
            let uiRow = cell.getRow();
            dispatch(dsActions.insertOneDoc(dsName, dsView, user.user, keyObj, rowData, uiRow)); 
            return;
        }
        // Edit logic
        let { oldVal, newVal } = this.fixValueType(cell, column, dsHome, dsView);

        let selectorObj = {};
        selectorObj["_id"] = _id;
        for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
            let key = dsHome.dsViews[dsView].keys[i];
            selectorObj[key] = cell.getRow().getData()[key];
        }
        selectorObj[column] = oldVal;

        let editObj = {};
        editObj[column] = newVal;
        let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
        let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
        dispatch(dsActions.editSingleAttribute(dsName, dsView, user.user, _id, column, oldVal, newVal, selectorObj, editObj, jiraConfig, jiraAgileConfig));

    }
    
    fixValueType(cell, column, dsHome, dsView) {
        let oldVal = cell.getOldValue();
        let typeOfOldVal = 'tbd';
        if (oldVal !== '')
            typeOfOldVal = typeof oldVal;
        console.log("Type of old val:", typeOfOldVal);
        console.log("oldvalue is: ", oldVal);
        //if (oldVal !== '' && !Number.isNaN(Number(oldVal))) oldVal = Number(oldVal);
        let newVal = cell.getValue();
        // Old logic, now overridden below. Will get rid of this
        // once I confirm the new logic works fine. 
        if (newVal !== '' && !Number.isNaN(Number(newVal)))
            newVal = Number(newVal);
        if (typeOfOldVal == 'string')
            newVal = newVal.toString();

        let configuredType = "string"; 
        try {
            for (let i = 0; i < dsHome.dsViews[dsView].columnAttrs.length; i++) {
                let col = dsHome.dsViews[dsView].columnAttrs[i];
                if (col.field == column) {
                    if (col.headerFilterType == 'number') {
                        configuredType = 'number';
                    }
                    break; 
                }
            }
        } catch (e) {}

        // This overrides the previous logic
        if (configuredType == 'string') {
            newVal = newVal.toString();
        } else if (configuredType == 'number') {
            if (newVal !== '' && !Number.isNaN(Number(newVal)))
                newVal = Number(newVal);
        }

        // XXX: Tabulator always sets the value to string. 
        // This fixes it correctly.
        cell.setValue(newVal);
        return { oldVal, newVal };
    }

    duplicateAndAddRowHandler (e, cell, pos) {
        const { match, dsHome } = this.props;
        let self = this
        let dsView = match.params.dsView;
        let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
        let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
        let rowData = cell.getRow().getData()
        if (this.isJiraRow(rowData, jiraConfig, jiraAgileConfig)) {
            this.setState({
                modalTitle: "Duplicate Row status",
                modalQuestion: `Can't duplicate a JIRA/JIRA_AGILE row`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        console.log("Duplicate and add row called..");
        let newData = JSON.parse(JSON.stringify(cell.getData()));
        delete newData._id;
        console.log("newData: ", newData);
        this.addRow(null, cell, newData, pos);
        //cell.setValue("");
    }

    /* Start: Handling of single row delete */
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

    deleteRowHandler (e, cell, confirmed) {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        console.log("Delete row handler called...:", confirmed);
        if (confirmed) {
            let _id = cell.getRow().getData()['_id'];
            if (!_id) {
                cell.getRow().delete();
                return;
            }
            dispatch(dsActions.deleteOneDoc(dsName, dsView, user.user, _id, cell.getRow()));
        }
        this.setState({ showModal: !this.state.showModal });
    }

    deleteRowQuestion (e, cell) {
        let me = this;
        this.setState({
            modalTitle: "Delete current row?",
            modalQuestion: `This will delete the current row. Please confirm. Undoing support is not yet available!`,
            modalOk: "Delete",
            modalCallback: (confirmed) => me.deleteRowHandler(e, cell, confirmed),
            showModal: !this.state.showModal
        });
    }

    /* End: Handling of single row delete */

    /* Start: Handling of delete all rows in view */

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
                    /*
                    let rows = dsHome.dsDeletes[k].deleteTracker.rows;
                    for (let i = 0; i < rows.length; i++)
                        rows[i].delete();
                    */
                    this.ref.table.clearData();
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
        let rows = this.ref.table.getRows();
        this.setState({
            modalTitle: "Delete all rows in view?",
            modalQuestion: `This will delete ${rows.length} rows. Please confirm. Undoing support is not yet available!`,
            modalOk: "Delete",
            modalCallback: this.deleteAllRowsInView,
            showModal: !this.state.showModal
        });
    }

    /* End: Handling of all rows in view */


    /* Start: Handling of delete all rows in queries */
    async deleteAllRowsInQuery() {
        const { match, user } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let body = {};
        let baseUrl = `${config.apiUrl}/ds/deleteFromQuery/${dsName}/${dsView}/${user.user}`
        let filters = this.ref.table.getHeaderFilters();
        let url = this.ajaxURLGenerator(baseUrl, {}, { filters, pretend: true });
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(url, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
            }     
        });
        let responseJson = null;
        if (response.ok) {
            responseJson = await response.json();
            console.log('deleteFromQuery responseJson total: ', responseJson.total);
            this.setState({
                modalTitle: "Delete all Rows in query?",
                modalQuestion: `This will delete ${responseJson.total} rows. Please confirm. Undoing support is not yet available!`,
                modalOk: "Delete",
                modalCallback: async (confirmed) => {
                    if (confirmed) {
                        url = this.ajaxURLGenerator(baseUrl, {}, { filters, pretend: false });
                        let dataLen = JSON.stringify(body).length.toString();
                        let response = await fetch(url, {
                            method: "post",
                            body: JSON.stringify(body),
                            headers: {
                                "Content-Type": "application/json",
                                "Content-Length": dataLen,
                            }
                        });
                        if (response.ok) {
                            let delJson = await response.json();
                            if (delJson.count == responseJson.total) {
                                this.ref.table.clearData();
                            }
                        }
                    }
                },
                showModal: !this.state.showModal
            });            
        }
        return responseJson;
    }

    /* End: Handling of delete all rows in queries */

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

    /**Start convert to JIRA row */
    handleJiraFormChange(obj) {
        let key = Object.keys(obj)[0]
        if (key && key === "Project" || key == "JIRA_AGILE_LABEL" || key == "Type" || key === "summary" || key === "description") {
            this.jiraFormData = {
                ...this.jiraFormData,
                [key]: obj[key]
            }
        } else {
            this.jiraFormData = {
                ...this.jiraFormData,
                [this.jiraFormData.Type]: {
                    ...this.jiraFormData[this.jiraFormData.Type],
                    ...obj
                }
            }
        }
    }

    formFinalJiraFormData() {
        let jiraFormData = JSON.parse(JSON.stringify(this.jiraFormData));
        for (let field of Object.keys(jiraFormData)) {
            if (!jiraFormData[field]) continue;
            if (typeof jiraFormData[field] !== 'object') continue;
            jiraFormData[field].summary = jiraFormData.summary;
            jiraFormData[field].description = jiraFormData.description;
        }
        delete jiraFormData.summary;
        delete jiraFormData.description;
        return jiraFormData;
    }

    async submitJiraFormChange(confirmed, _id, selectorObj) {
        if (confirmed) {
            const { dispatch, match, user, dsHome } = this.props;
            let dsName = match.params.dsName;
            let dsView = match.params.dsView;
            let username = user.user;
            let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
            let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
            let jiraFormData = this.formFinalJiraFormData()
            this.updateLocalStorage(jiraFormData)
            if (jiraFormData.Type == "Bug") {
                //Just before sending change the value of key customfield_25578 to array
                jiraFormData[jiraFormData.Type].customfield_25578 = jiraFormData[jiraFormData.Type].customfield_25578.split(",")
            }
            // dispatch(dsActions.convertToJira(dsName, dsView, user.user, _id, selectorObj, jiraFormData, jiraConfig, jiraAgileConfig));
            //reset the jiraFormData value
            let response = await dsService.convertToJira({ dsName, dsView, username, selectorObj, jiraFormData, jiraConfig, jiraAgileConfig })
            let secondaryModalStatus = this.state.modalStatus;
            let modalStatus = this.state.modalStatus;
            let showSecondaryModal = false
            if (response) {
                if (response.status == 'success') {
                    let fullUpdatedRec = response.record
                    let update = {
                        _id: _id,
                        ...fullUpdatedRec
                    }
                    this.ref.table.updateData([update]);
                    modalStatus += `Update <b style="color:green">Update done</b> <br/> Jira issue Key for converted row: ${response.key}<br/><br/>`
                    let modalQuestion = modalStatus ? <div dangerouslySetInnerHTML={{ __html: modalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
                    this.setState({
                        modalTitle: "Convert Status",
                        modalQuestion: modalQuestion,
                        modalStatus: modalStatus,
                        modalOk: "Dismiss",
                        modalCallback: (confirmed) => { this.setState({ showModal: false, modalQuestion: '', modalStatus: '', grayOutModalButtons: false }) },
                        showModal: true,
                        toggleModalOnClose: true,
                        grayOutModalButtons: false
                    });
                    let obj = {
                        Project: "",
                        JIRA_AGILE_LABEL: "None",
                        Type: "Epic",
                        summary: "",
                        description: ""
                    }
                    this.jiraFormData = obj
                    this.jiraFormData = {
                        ...this.jiraFormData,
                        ...dsHome.defaultTypeFieldsAndValues.value.projects[0].issuetypes
                    }
                } else {
                    secondaryModalStatus += `Update <b style="color:red">failed</b><br/> <b style="color:red">Error: ${response.error}</b><br/><br/>`
                    showSecondaryModal = true;
                }
            } else {
                secondaryModalStatus += `Update <b style="color:red">failed</b><br/><br/>`
                showSecondaryModal = true;
            }
            if (showSecondaryModal /* && !this.state.showModal*/) {
                let self = this;
                let secondaryModalQuestion = secondaryModalStatus ? <div dangerouslySetInnerHTML={{ __html: secondaryModalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
                this.setState({
                    secondaryModalTitle: "Convert Status",
                    secondaryModalQuestion: secondaryModalQuestion,
                    secondaryModalStatus: secondaryModalStatus,
                    secondaryModalOk: "Dismiss",
                    secondaryModalCallback: (confirmed) => { self.setState({ showSecondaryModal: false, secondaryModalQuestion: '', secondaryModalStatus: '', grayOutModalButtons: false }) },
                    showSecondaryModal: true,
                });
            }
        } else {
            this.setState({ showModal: !this.state.showModal, toggleModalOnClose: true });
        }
    }

    async convertToJiraRow(e, cell) {
        let self = this
        const { match, dsHome, user } = this.props;
        let dsView = match.params.dsView;
        let dsName = match.params.dsName;
        let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
        let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
        let dsUser = user.user;
        if ((!jiraConfig || !jiraConfig.jira) && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to convert to JIRA row`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        let data = cell.getRow().getData()
        if (this.isJiraRow(data, jiraConfig, jiraAgileConfig)) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Already a JIRA row. Cannot convert it further.!!`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        let projectsMetaData = await dsService.getProjectsMetaData({ dsName, dsView, dsUser, jiraAgileConfig, jiraConfig })
        if (!projectsMetaData || Object.keys(projectsMetaData).length == 0) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Unable to fetch projects metaData. Update JiraSettings correctly to fetch metadata.`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        let copyOfDefaults = JSON.parse(JSON.stringify(dsHome.defaultTypeFieldsAndValues.value.projects[0].issuetypes))
        this.jiraFormData = {
            ...this.jiraFormData,
            ...copyOfDefaults
        }
        this.fillLocalStorageItemData(projectsMetaData.projects[0].issuetypes)
        let rowData = cell.getRow().getData()
        this.formInitialJiraForm(rowData, jiraConfig, jiraAgileConfig)
        if (this.jiraFormData.Type == "Bug" && (!jiraConfig || !jiraConfig.jira)) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Trying to convert Bug type without enabling the Jira. Please enable it first in edit-view`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        if ((this.jiraFormData.Type == "Epic" || this.jiraFormData.Type == "Story" || this.jiraFormData.Type == "Story Task") && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Trying to convert ${this.jiraFormData.Type} type without enabling the Jira_Agile. Please enable it first in edit-view`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        if ((jiraConfig && jiraConfig.jira) || (jiraAgileConfig && jiraAgileConfig.jira)) {
            let _id = cell.getRow().getData()['_id'];
            let selectorObj = {};
            selectorObj["_id"] = _id;
            for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
                let key = dsHome.dsViews[dsView].keys[i];
                selectorObj[key] = cell.getRow().getData()[key];
            }
            let jiraAgileBoard = jiraAgileConfig.label
            this.setState({
                modalTitle: "Jira row specifications:- ",
                modalOk: "Convert",
                modalQuestion: <JiraForm formData={this.jiraFormData} handleChange={this.handleJiraFormChange} jiraEnabled={dsHome.dsViews[dsView].jiraConfig && dsHome.dsViews[dsView].jiraConfig.jira} jiraAgileEnabled={dsHome.dsViews[dsView].jiraAgileConfig && dsHome.dsViews[dsView].jiraAgileConfig.jira} jiraAgileBoard={jiraAgileBoard} projectsMetaData={projectsMetaData} />,
                modalCallback: (confirmed) => {
                    self.submitJiraFormChange(confirmed, _id, selectorObj)
                },
                showModal: !this.state.showModal,
                toggleModalOnClose: false,
            })
        } else {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `<b>Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to convert to JIRA row</b>`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
        }
    }

    fillLocalStorageItemData(issueTypes) {
        try {
            for (let key of Object.keys(this.jiraFormData)) {
                if (typeof this.jiraFormData[key] == "object") {
                    let localStorageItem = localStorage.getItem(key)
                    if (localStorageItem && localStorageItem != "undefined") {
                        let parsedLocalItem = JSON.parse(localStorageItem)
                        for (let parsedKey of Object.keys(parsedLocalItem)) {
                            if (this.jiraFormData[key].hasOwnProperty(parsedKey)) {
                                let { isValidated, defaultValue } = this.validateAndGetDefaultValue(issueTypes, key, parsedKey, parsedLocalItem[parsedKey])
                                if (isValidated && defaultValue != null) {
                                    this.jiraFormData[key][parsedKey] = defaultValue
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) { }
    }

    validateAndGetDefaultValue(issueTypes, issueType, field, value) {
        let isValidated = false;
        let defaultValue = null;
        if (field === "customfield_25578") {
            isValidated = true;
            defaultValue = value;
            return { isValidated, defaultValue }
        }
        for (let i = 0; i < issueTypes.length; i++) {
            if (issueTypes[i].name != issueType) { continue }
            let currIssueObj = issueTypes[i];
            let fieldObj = currIssueObj.fields[field];
            if (fieldObj) {
                if (fieldObj.type == "array" && fieldObj.allowedValues) {
                    for (let k = 0; k < value.length; k++) {
                        if (!fieldObj.allowedValues.includes(value[k])) {
                            isValidated = false;
                            return { isValidated, defaultValue }
                        }
                    }
                    isValidated = true
                    defaultValue = value
                    return { isValidated, defaultValue }
                } else if (fieldObj.type == "option" && fieldObj.allowedValues) {
                    if (fieldObj.allowedValues.includes(value)) {
                        isValidated = true;
                        defaultValue = value;
                        return { isValidated, defaultValue }
                    } else {
                        isValidated = false;
                        return { isValidated, defaultValue }
                    }
                } else if (fieldObj.type == "creatableArray" && fieldObj.allowedValues) {
                    if (fieldObj.allowedValues.includes(value)) {
                        isValidated = true;
                        defaultValue = value;
                        return { isValidated, defaultValue }
                    } else {
                        isValidated = false;
                        return { isValidated, defaultValue }
                    }
                } else if (fieldObj.type == "searchableOption" && fieldObj.allowedValues) {
                    let allowedValues = fieldObj.allowedValues.map((e) => e.key)
                    if (allowedValues.includes(value)) {
                        isValidated = true;
                        defaultValue = value;
                        return { isValidated, defaultValue }
                    } else {
                        isValidated = false;
                        return { isValidated, defaultValue }
                    }
                } else {
                    isValidated = true
                    defaultValue = value
                    return { isValidated, defaultValue }
                }
            } else {
                return { isValidated, defaultValue }
            }
        }
        return { isValidated, defaultValue }
    }

    formInitialJiraForm(rowData, jiraConfig, jiraAgileConfig) {
        try {
            let fieldMapping = null
            if (jiraConfig && jiraConfig.jira) {
                fieldMapping = jiraConfig.jiraFieldMapping
            }
            if (jiraAgileConfig && jiraAgileConfig.jira) {
                fieldMapping = {
                    ...fieldMapping,
                    ...jiraAgileConfig.jiraFieldMapping
                }
            }
            if (!fieldMapping) return
            let summary = ""
            let description = ""
            let descriptionDone = false
            let type = ""
            let storyPoints = 0
            if (fieldMapping["summary"]) {
                let value = rowData[fieldMapping["summary"]]
                let arr = value.split("\n")
                if (arr.length >= 2) {
                    let summaryLine = arr[0]
                    let matchArr = summaryLine.match((/#+(.*)/))
                    if (matchArr && matchArr.length >= 2) {
                        summary = matchArr[1].trim()
                    } else {
                        summary = summaryLine
                    }
                    description = arr.join("\n").trim()
                    descriptionDone = true
                } else if (arr.length == 1) {
                    let summaryLine = arr[0]
                    let matchArr = summaryLine.match((/#+(.*)/))
                    if (matchArr && matchArr.length >= 2) {
                        summary = matchArr[1].trim()
                    } else {
                        summary = summaryLine
                    }
                }
            }
            if (fieldMapping["type"]) {
                if (rowData[fieldMapping["type"]].match(/(t|T)ask/))
                    type = "Story Task"
                else if (rowData[fieldMapping["type"]].match(/(b|B)ug/))
                    type = "Bug"
                else if (rowData[fieldMapping["type"]].match(/(e|E)pic/))
                    type = "Epic"
                else if (rowData[fieldMapping["type"]].match(/(s|S)tory/))
                    type = "Story"
            }
            if (!descriptionDone && fieldMapping["description"]) {
                description = rowData[fieldMapping["description"]].trim()
            }
            if (fieldMapping["Story Points"]) {
                if (typeof rowData[fieldMapping["Story Points"]] == 'number')
                    storyPoints = rowData[fieldMapping["Story Points"]]
                else if (typeof rowData[fieldMapping["Story Points"]] == 'string')
                    storyPoints = parseInt(rowData[fieldMapping["Story Points"]])
            }

            if (type == "Epic" || type == "Story" || type == "Bug" || type == "Story Task") {
                this.jiraFormData["Type"] = type
            }
            this.jiraFormData['summary'] = summary
            this.jiraFormData['description'] = description
            for (let key of Object.keys(this.jiraFormData)) {
                if (typeof this.jiraFormData[key] != 'object') continue
                if (storyPoints != 0 && jiraCustomFieldMapping['Story Points']) {
                    if (this.jiraFormData[key][jiraCustomFieldMapping['Story Points']] == 0 || this.jiraFormData[key][jiraCustomFieldMapping['Story Points']]) this.jiraFormData[key][jiraCustomFieldMapping['Story Points']] = storyPoints
                }
            }
        } catch (e) { }
    }

    isJiraRow(data, jiraConfig, jiraAgileConfig) {
        let fieldMapping = null
        if (jiraConfig && jiraConfig.jira) {
            fieldMapping = jiraConfig.jiraFieldMapping
        }
        if (jiraAgileConfig && jiraAgileConfig.jira) {
            fieldMapping = {
                ...fieldMapping,
                ...jiraAgileConfig.jiraFieldMapping
            }
        }
        if (!fieldMapping) return false
        let key = data[fieldMapping['key']]
        if (!key) return false
        if (key.match(/https:(.*)\/browse\//)) return true
        return false
    }
    /**End convert to JIRA row */

    /**Start add a jira issue */
    async addJiraRow(e, cell, type) {
        let self = this
        const { match, dsHome, user } = this.props;
        let dsView = match.params.dsView;
        let dsName = match.params.dsName;
        let dsUser = user.user;
        let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
        let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
        if ((!jiraConfig || !jiraConfig.jira) && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
            this.setState({
                modalTitle: "Add JIRA status",
                modalQuestion: `Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to add a JIRA row`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        if (cell && type) {
            let rowData = cell.getRow().getData()
            if (!this.isJiraRow(rowData, jiraConfig, jiraAgileConfig)) {
                this.setState({
                    modalTitle: "Add JIRA status",
                    modalQuestion: `Cannot add JIRA as child of non-Jira row`,
                    modalOk: "Dismiss",
                    modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                    showModal: true
                })
                return
            }
            let isValid = this.checkIfValid(rowData, type, jiraConfig, jiraAgileConfig)
            if (!isValid) {
                this.setState({
                    modalTitle: "Add JIRA status",
                    modalQuestion: `Can't add ${type} to current row.`,
                    modalOk: "Dismiss",
                    modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                    showModal: true
                })
                return
            }

        }
        let projectsMetaData = await dsService.getProjectsMetaData({ dsName, dsView, dsUser, jiraAgileConfig, jiraConfig })
        if (!projectsMetaData || Object.keys(projectsMetaData).length == 0) {
            this.setState({
                modalTitle: "Add JIRA status",
                modalQuestion: `Unable to fetch projects metaData. Update JiraSettings correctly to fetch metadata.`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        let copyOfDefaults = JSON.parse(JSON.stringify(dsHome.defaultTypeFieldsAndValues.value.projects[0].issuetypes))
        this.jiraFormData = {
            ...this.jiraFormData,
            ...copyOfDefaults
        }
        this.fillLocalStorageItemData(projectsMetaData.projects[0].issuetypes)
        if (type)
            this.jiraFormData.Type = type
        if (this.jiraFormData.Type == "Bug" && (!jiraConfig || !jiraConfig.jira)) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Trying to add Bug type without enabling the Jira. Please enable it first in edit-view`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        if ((this.jiraFormData.Type == "Epic" || this.jiraFormData.Type == "Story" || this.jiraFormData.Type == "Story Task") && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Trying to add ${this.jiraFormData.Type} type without enabling the Jira_Agile. Please enable it first in edit-view`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
        if ((jiraConfig && jiraConfig.jira) || (jiraAgileConfig && jiraAgileConfig.jira)) {
            let jiraAgileBoard = null
            try {
                jiraAgileBoard = jiraAgileConfig.label
                this.jiraFormData.JIRA_AGILE_LABEL = jiraAgileBoard
            } catch (e) { }
            let jiraId = null
            let selectorObj = null
            if (type) {
                jiraId = this.getJiraId(cell.getRow().getData(), jiraConfig, jiraAgileConfig)
                if (this.jiraFormData.Type == 'Story') {
                    this.jiraFormData[this.jiraFormData.Type].customfield_12790 = jiraId
                } else if (this.jiraFormData.Type == "Story Task") {
                    this.jiraFormData[this.jiraFormData.Type].parent = jiraId
                }
                let _id = cell.getRow().getData()['_id'];
                selectorObj = {};
                selectorObj["_id"] = _id;
            }
            this.setState({
                modalTitle: "Jira specifications:- ",
                modalOk: "Add",
                modalQuestion: <JiraForm formData={this.jiraFormData} handleChange={this.handleJiraFormChange} jiraEnabled={dsHome.dsViews[dsView].jiraConfig && dsHome.dsViews[dsView].jiraConfig.jira} jiraAgileEnabled={dsHome.dsViews[dsView].jiraAgileConfig && dsHome.dsViews[dsView].jiraAgileConfig.jira} jiraAgileBoard={jiraAgileBoard} projectsMetaData={projectsMetaData} />,
                modalCallback: (confirmed) => {
                    self.submitAddJira(confirmed, jiraId, selectorObj)
                },
                showModal: !this.state.showModal,
                toggleModalOnClose: false
            })
        } else {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `<b>Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to convert to JIRA row</b>`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
        }
    }

    checkIfValid(rowData, type, jiraConfig, jiraAgileConfig) {
        let fieldMapping = null
        if (jiraConfig && jiraConfig.jira) {
            fieldMapping = jiraConfig.jiraFieldMapping
        }
        if (jiraAgileConfig && jiraAgileConfig.jira) {
            fieldMapping = {
                ...fieldMapping,
                ...jiraAgileConfig.jiraFieldMapping
            }
        }
        if (!fieldMapping) return false
        try {
            if (type == 'Story' && rowData[fieldMapping['type']] == 'Epic') {
                return true
            } else if (type == 'Story Task' && rowData[fieldMapping['type']] == 'Story') {
                return true
            } else {
                return false
            }
        } catch (e) { return false }
    }

    getJiraId(rowData, jiraConfig, jiraAgileConfig) {
        let fieldMapping = null
        if (jiraConfig && jiraConfig.jira) {
            fieldMapping = jiraConfig.jiraFieldMapping
        }
        if (jiraAgileConfig && jiraAgileConfig.jira) {
            fieldMapping = {
                ...fieldMapping,
                ...jiraAgileConfig.jiraFieldMapping
            }
        }
        try {
            let key = rowData[fieldMapping['key']]
            let regex = new RegExp(`/browse/(.*)\\)`)
            let jiraIssueIdMatchArr = key.match(regex)
            if (jiraIssueIdMatchArr && jiraIssueIdMatchArr.length >= 2) {
                key = jiraIssueIdMatchArr[1]
            }
            return key
        } catch (e) { }
        return ""
    }

    async submitAddJira(confirmed, parentKey, parentSelectorObj) {
        if (confirmed) {
            const { dispatch, match, user, dsHome } = this.props;
            let dsName = match.params.dsName;
            let dsView = match.params.dsView;
            let username = user.user;
            let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
            let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
            let jiraFormData = this.formFinalJiraFormData();
            this.updateLocalStorage(jiraFormData)
            if (jiraFormData.Type == "Bug") {
                //Just before sending change the value of key customfield_25578 to array
                jiraFormData[jiraFormData.Type].customfield_25578 = jiraFormData[jiraFormData.Type].customfield_25578.split(",")
            }
            //reset the jiraFormData value
            let response = await dsService.addJiraRow({ dsName, dsView, username, jiraFormData, jiraConfig, jiraAgileConfig, parentKey, parentSelectorObj })
            let secondaryModalStatus = this.state.modalStatus;
            let modalStatus = this.state.modalStatus;
            let showSecondaryModal = false
            if (response) {
                if (response.status == 'success') {
                    let fullUpdatedRec = response.record
                    let update = {
                        _id: response._id,
                        ...fullUpdatedRec
                    }
                    this.ref.table.addRow(update, true, null)
                    if (response.parentRecord) {
                        let fullParentUpdatedRec = response.parentRecord
                        let update = {
                            _id: parentSelectorObj._id,
                            ...fullParentUpdatedRec
                        }
                        this.ref.table.updateData([update]);
                    }
                    modalStatus += `<b style="color:green">Update done</b> <br/> Jira issue Key for converted row: ${response.key}<br/><br/>`
                    let modalQuestion = modalStatus ? <div dangerouslySetInnerHTML={{ __html: modalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
                    this.setState({
                        modalTitle: "Convert Status",
                        modalQuestion: modalQuestion,
                        modalStatus: modalStatus,
                        modalOk: "Dismiss",
                        modalCallback: (confirmed) => { this.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                        showModal: true,
                        toggleModalOnClose: true,
                        grayOutModalButtons: false
                    });
                    let obj = {
                        Project: "",
                        JIRA_AGILE_LABEL: "None",
                        Type: "Epic",
                    }
                    this.jiraFormData = obj
                    this.jiraFormData = {
                        ...this.jiraFormData,
                        ...dsHome.defaultTypeFieldsAndValues.value.projects[0].issuetypes
                    }
                } else {
                    secondaryModalStatus += `Update <b style="color:red">failed</b><br/> <b style="color:red">Error: ${response.error})</b><br/><br/>`
                    showSecondaryModal = true;
                }
            } else {
                secondaryModalStatus += `Update <b style="color:red">failed</b><br/><br/>`
                showSecondaryModal = true;
            }
            if (showSecondaryModal /* && !this.state.showModal*/) {
                let self = this;
                let secondaryModalQuestion = secondaryModalStatus ? <div dangerouslySetInnerHTML={{ __html: secondaryModalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
                this.setState({
                    secondaryModalTitle: "Convert Status",
                    secondaryModalQuestion: secondaryModalQuestion,
                    secondaryModalStatus: secondaryModalStatus,
                    secondaryModalOk: "Dismiss",
                    secondaryModalCallback: (confirmed) => { self.setState({ showSecondaryModal: false, secondaryModalQuestion: '', secondaryModalStatus: '', grayOutModalButtons: false }) },
                    showSecondaryModal: true
                });
            }
        } else {
            this.setState({ showModal: !this.state.showModal, toggleModalOnClose: true });
        }
    }

    updateLocalStorage(jiraFormData) {
        try {
            for (let key of Object.keys(jiraFormData)) {
                if (typeof jiraFormData[key] == "object") {
                    let objStringified;
                    let obj = {
                        ...jiraFormData[key]
                    }
                    if (obj["summary"]) obj["summary"] = ""
                    if (obj["description"]) obj["description"] = ""
                    if (obj["customfield_12791"]) obj["customfield_12791"] = ""
                    objStringified = JSON.stringify(obj)
                    localStorage.setItem(key, objStringified)
                }
            }
        } catch (e) { }
    }

    /**End add a jira issue */

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
        let me = this;
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
                label:"Duplicate row & add (above)",
                action: function (e, cell) {
                    me.duplicateAndAddRowHandler(e, cell, true)
                }
            },
            {
                label:"Duplicate row & add (below)",
                action: function (e, cell) {
                    me.duplicateAndAddRowHandler(e, cell, false)
                }
            },
            {
                label:"Add empty row...",
                action: function (e, cell) {
                    me.addRow(e, cell, null, true)
                }
            },
            {
                label:"Copy cell to clipboard...",
                action: this.copyCellToClipboard
            },
            {
                label:"Generate slides...",
                action: this.startPreso
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
                label:"Delete all rows in query...",
                action: this.deleteAllRowsInQuery
            },
            {
                label:"Delete row...",
                action: this.deleteRowQuestion
            },
            {
                separator: true
            },
            {
                label: "Convert to JIRA row...",
                action: this.convertToJiraRow
            },
            {
                label: "Add new JIRA...",
                action: function (e, cell) {
                    me.addJiraRow(e, cell, null)
                }
            },
            {
                label: "Add Story to Epic",
                action: function (e, cell) {
                    me.addJiraRow(e, cell, 'Story')
                }
            },
            {
                label: "Add a Story Task to Story",
                action: function (e, cell) {
                    me.addJiraRow(e, cell, 'Story Task')
                }
            }
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
            // This handles all editing trigger logic. We always use 
            // the force edit feature here. 
            col.cellForceEditTrigger = this.cellForceEditTrigger;

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
                    //console.log("html formatter");
                    let value = cell.getValue();
                    doConditionalFormatting(cell, formatterParams);
                    if (value === undefined) return "";
                    if (typeof value != "string") return value;
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;margin-bottom:-12px;">${value}</div>`;
                }
                // Control comes here during full table clipboard copy.
                // from this.myCopyToClipboard function call. 
                col.formatterClipboard = (cell, formatterParams) => {
                    //console.log("html clipboard");
                    //console.log("cell element: ", cell.getElement());
                    //console.log("cell field is: ", cell.getField());
                    //console.log("cell cell is: ", cell.getRow().getCell(cell.getField())._cell.element);
                    let h = cell.getRow().getCell(cell.getField())._cell.element;
                    h = h.cloneNode(true);
                    // Setting the color of the original cell on the encapsulating
                    // element during copy-to-clipboard. 
                    cell.getElement().style.backgroundColor = h.style.backgroundColor;
                    cell.getElement().style.color = h.style.color;
                    //console.log("Returning, h: ", h);
                    return h;
                }

                /* // This loses conditional formatting! (Solved above!)
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
                    col.editorParams.dsName = dsName;
                    if (col.editor === "textarea")
                        col.editor = MyTextArea;
                    else 
                        col.editor = MyCodeMirror;
                    //col.editor = MyModalCodeMirror;
                    let me = this;
                    col.cellEditCancelled = (cell) => {
                        if (!me.cellImEditing) {
                            console.log("Normalize, Inside second editcancelled..")
                            cell.getRow().normalizeHeight();
                        } else {
                            console.log("Skipping normalize, Inside second editcancelled");
                        }
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
            if (col.editor === "date") {
                col.editor = DateEditor;
                col.editorParams = { format: "MM/DD/YYYY" };
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
        //console.log(`In ajaxResponse, params: ${JSON.stringify(params, null, 4)}, url: ${url},  response.total: ${response.total}, response.reqCount: ${response.reqCount}, state.initialHeaderFilter: ${JSON.stringify(this.state.initialHeaderFilter, null, 4)}`);
        if ((response.reqCount == this.reqCount) || (response.reqCount == 0)) {
            this.setState({ totalRecs: response.total});
        } else {
            console.log(`In ajaxResponse, avoided stale setting of response.total!`);
        }
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
                params.reqCount = ++(this.reqCount);
                if(!config.method || config.method.toLowerCase() == "get"){
                    config.method = "get";
    
                    url += (url.includes("?") ? "&" : "?") + this.serializeParams(params);
                }
            }
        }
        return url;    
    }

    step2 () {
        const { match, user, dsHome } = this.props;
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
            let me = this;
            s2 = <Row>
                        <div id="tabulator">
                            <MyTabulator
                                columns={columns}
                                data={[]}
                                options={{
                                    ajaxURL: `${config.apiUrl}/ds/view/${this.props.match.params.dsName}/${dsView}/${user.user}`,
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
                                    paginationSizeSelector: [5, 10, 25, 30, 50, 100, 500, 1000, 2000, 5000, true],
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
                                    clipboard: "fullTableCopyOnly",
                                    clipboardCopyFormatter: (type, output) => {
                                        if (type === 'html') {
                                            output = me.fixImgSizeForClipboard(output);
                                            
                                            output=output.replaceAll('<th>', '<th style="border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: darkgreen;color: white;">');
                                            
                                            output=output.replaceAll('<td>', '<td style="border: 1px solid #ddd; padding: 8px;">')
                                            // To replace the markup due to the highlightjs badges. The regex arrived by looking at the generated markup and some clever regex as usual. 
                                            //console.log("Output: ", output);
                                            output=output.replace(/<pre class="code-badge-pre"[\s\S]*?(<code [\s\S]*?<\/code>)<\/pre>/gi, '<pre>$1</pre>');
                                            //console.log("Output: ", output);
                                        }
                                        return output;
                                    },
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

    displayConnectedStatus () {
        if (this.state.connectedState) {
            return <span><i class='fas fa-server'></i> <b>Server connection:</b> <b style={{ 'color': 'darkgreen' }}>Connected</b></span>
        } else {
            return <span><i class='fas fa-server'></i> <b>Server connection:</b> <b style={{ 'color': 'red' }}>Disconnected</b></span>
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
        if (document.title != dsName) {
            document.title = dsName;
        }        
        try {
            if ((dsHome.dsViews[dsView].jiraConfig && dsHome.dsViews[dsView].jiraConfig.jira) || (dsHome.dsViews[dsView].jiraAgileConfig && dsHome.dsViews[dsView].jiraAgileConfig.jira)) {
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
                <Col md={12} sm={12} xs={12}> 
                    <b><i class='fas fa-clone'></i> Total records: {this.state.totalRecs} | </b>
                    <Link to={`/dsEditLog/${match.params.dsName}`} target="_blank"><i class='fas fa-file-alt'></i> <b>Edit-log</b></Link> |&nbsp;
                    <Link to={`/dsViewEdit/${match.params.dsName}/${match.params.dsView}`} target="_blank"><i class='fas fa-edit'></i> <b>Edit-view</b></Link> |&nbsp;
                    <Link to={`/dsBulkEdit/${match.params.dsName}`} target="_blank"><i class='fas fa-edit'></i> <b>Bulk-edit</b></Link> |&nbsp;
                    <Link to={`/dsAttachments/${match.params.dsName}`} target="_blank"><i class='fas fa-file-alt'></i> <b>Attachments</b></Link> |&nbsp;
                    {this.displayConnectedStatus()}
                </Col>
                </Row>
                {this.step2()}
                <Modal show={this.state.showModal}
                    onClose={this.toggleModal} title={this.state.modalTitle} cancel={this.state.modalCancel} ok={this.state.modalOk} toggleModalOnClose={this.state.toggleModalOnClose} grayOutModalButtons={this.state.grayOutModalButtons}>
                    {this.state.modalQuestion}
                </Modal>
                <Modal show={this.state.showSecondaryModal}
                    onClose={this.secondaryToggleModal} title={this.state.secondaryModalTitle} cancel={this.state.secondaryModalCancel} ok={this.state.secondaryModalOk}>
                    {this.state.secondaryModalQuestion}
                </Modal>
                <ModalEditor show={this.state.showModalEditor} 
                            title={this.state.modalEditorTitle} text={this.state.modalEditorText} onClose={this.toggleModalEditor}
                            cancel={this.state.modalEditorCancel} ok={this.state.modalEditorOk}>
                </ModalEditor>
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
