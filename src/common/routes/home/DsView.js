import React, { Component } from 'react'
import { Route } from 'react-router-dom'
import { Row, Col } from 'react-bootstrap'
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
//import MyModalCodeMirror from './MyModalCodeMirror';
import DateEditor from "react-tabulator/lib/editors/DateEditor";
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
import Notification from './Notification.js';
//import "reveal.js/dist/theme/white.css";
import './rjs_white.css';
import JiraForm from './jiraForm.js'
//import Reveal from 'reveal.js';
//import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
//import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm'
import io from 'socket.io-client'
//import '../../../../node_modules/react-tabulator/lib/styles.css'; // required styles
//import '../../../../node_modules/react-tabulator/lib/css/tabulator.css';
import './simpleStyles.css';
import markdownItMermaid from "@datatraccorporation/markdown-it-mermaid";
import { dsService } from '../../services';
import AddColumnForm from './addColumnForm.js';
import { authHeader } from '../../helpers';
import createClipboardHelpers from './ds/clipboardHelpers';
import createSocketHandlers from './ds/socketHandlers';
import createDomHelpers from './ds/domHelpers';
import createTabulatorConfig from './ds/tabulatorConfig';
import createJiraHelpers from './ds/jiraHelpers';
let MarkdownIt = new require('markdown-it')({
    linkify: true,
    html: true
}).use(require('markdown-it-bracketed-spans')).use(require('markdown-it-attrs')).use(require('markdown-it-container'), 'code').use(require('markdown-it-container'), 'indent1').use(require('markdown-it-container'), 'indent2').use(require('markdown-it-container'), 'indent3').use(require('markdown-it-highlightjs')).use(markdownItMermaid).use(require('markdown-it-plantuml'), {imageFormat: 'png'}).use(require('markdown-it-container'), 'slide').use(require('markdown-it-fancy-lists').markdownItFancyListPlugin);
// From: https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender = MarkdownIt.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

var defaultFence = MarkdownIt.renderer.rules.fence;
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

MarkdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    if (token.info === "plotly" && token.content) {
        const encoded = encodeURIComponent(token.content);
        const id = `plotly-graph-${idx}`;
        return `<div id=${id} class="plotly-graph" data-plot='${encoded}'></div>`;
    }
    return defaultFence(tokens, idx, options, env, self)
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

var socket = null;
class DsView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            firstTime: true,
            filterButtonText: 'Enable Filters',
            editingButtonText: 'Disable Editing',
            pageSize: 30,
            totalRecs: 0, 
            moreMatchingDocs: false,
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
            modalError:'',
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
            dbconnectivitystate: false,

            queryString: "",
            _id: "",

            showNotification: false,
            notificationType: "success", // this can be "success" or "failure", defaults to success
            // Needs to be provided in case we want custom message in notification.
            // If not provided, the message will be SUCCESS for success notificationType and FAILURE for failure notificationtype
            notificationMessage: "",
            // If provided true, then it shows the fa icons like tick and cross in case of success and failure type respectively
            showIconsInNotification: false,
        };
        this.ref = null;
        
        this.timers = {};
        this.lockedByOthersCells = {};
        this.firstRenderCompleted = false;
        this.cellImEditing = null;
        this.mouseDownOnHtmlLink = false;
        this.mouseDownOnBadgeCopyIcon = false;
        this.reqCount = 0;
        this.columnResizedRecently = false;

        this.jiraFormData = {
            Project: "",
            JIRA_AGILE_LABEL: "None",
            Type: "Epic",
            summary: "",
            description: ""
        }

        this.fetchAllMatchingRecordsFlag = false;

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
        this.deleteColumnHandler = this.deleteColumnHandler.bind(this);
        this.deleteColumnStatus = this.deleteColumnStatus.bind(this);
        this.deleteColumnQuestion = this.deleteColumnQuestion.bind(this);
        this.addColumnHandler = this.addColumnHandler.bind(this);
        this.addColumnStatus = this.addColumnStatus.bind(this);
        this.addColumnQuestion = this.addColumnQuestion.bind(this);
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
        this.fetchAllMatchingRecords = this.fetchAllMatchingRecords.bind(this);

        this.processFilterViaUrl = this.processFilterViaUrl.bind(this);
        this.urlGeneratorFunction = this.urlGeneratorFunction.bind(this);
        this.urlGeneratorFunctionForRow = this.urlGeneratorFunctionForRow.bind(this);
        this.urlGeneratorFunctionForView = this.urlGeneratorFunctionForView.bind(this);
        this.copyTextToClipboard = this.copyTextToClipboard.bind(this);

        this.showCopiedNotification = this.showCopiedNotification.bind(this);

        const context = {
            props: this.props,
            getState: () => this.state,
            setState: (s) => this.setState(s),
            timers: this.timers,
            socket: () => socket,
            // allow helpers to set the module-scoped socket variable
            setSocket: (s) => { socket = s },
            // expose component and ref for handlers to call imperative APIs
            component: this,
            ref: () => this.ref,
            dispatch: this.props.dispatch,
            apiUrl: config.apiUrl,
            // Common UI components and utilities for helpers
            MyTextArea: MyTextArea,
            MyCodeMirror: MyCodeMirror,
            DateEditor: DateEditor,
            MyAutoCompleter: MyAutoCompleter,
            MySingleAutoCompleter: MySingleAutoCompleter,
            QueryParsers: QueryParsers,
            MarkdownIt: MarkdownIt
        };
        this._clipboard = createClipboardHelpers(context);
        this._socket = createSocketHandlers(context);
        this._dom = createDomHelpers(context);
        this._tabulator = createTabulatorConfig(context);
        this._jira = createJiraHelpers(context);

        let chronologyDescendingFrmLocal = localStorage.getItem("chronologyDescending");
        if (chronologyDescendingFrmLocal === "false") {
            this.state.chronologyDescending = false;
        } else {
            this.state.chronologyDescending = true;
        }
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
        this.renderPlotlyInCells = this.renderPlotlyInCells.bind(this)

        this.showNotificationTimeInMs = 2000; // by default show notification alert for 2 seconds.
    }
    componentDidMount () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        if ( !Object.keys(dsHome).length || !dsHome.dsViews || !dsHome.dsViews[dsView] ) {
            dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user));
            dispatch(dsActions.getDefaultTypeFieldsAndValues(dsName, dsView, user.user)); 
        }
        this._socket.init();
    }
    componentWillUnmount () {
        const { dispatch } = this.props;
        this._socket.disconnect();
        dispatch( { type: dsConstants.CLEAR_COLUMNS } );
    }

    componentDidUpdate(prevProps, prevState) {
        let showAllFiltersFrmLocal = localStorage.getItem("showAllFilters");
        showAllFiltersFrmLocal = JSON.parse(showAllFiltersFrmLocal);
        // If the query parameter or filter has been cleared, make the necessary state changes.
        if (prevProps.location.search !== this.props.location.search) {
            if (this.props.location.search) {
                this.processFilterViaUrl(this.props.location.search);
            } else {
                this.setState({
                    ...this.state,
                    queryString: "",
                    _id: "",
                    initialHeaderFilter: [],
                    showAllFilters: showAllFiltersFrmLocal,
                    refresh: this.state.refresh + 1
                })
            }
        } else if (prevProps.location.pathname !== this.props.location.pathname) {
            if (!this.props.match.params.filter) {
                this.setState({
                    filter: "",
                    initialHeaderFilter: [],
                    initialSort: [],
                    filterColumnAttrs: {},
                    showAllFilters: showAllFiltersFrmLocal,
                    refresh: this.state.refresh + 1
                })
            }
        }
    }

    processFilterViaUrl(queryString) {
        if (!queryString) return;
        if (this.state.queryString === queryString) return;
        const { match, dsHome } = this.props;
        let showFilter = this.state.showAllFilters;
        let chronologyDescending = this.state.chronologyDescending;
        let pageSize = this.state.pageSize;
        let initialSort = JSON.parse(JSON.stringify(this.state.initialSort));
        let filterColumnAttrs = JSON.parse(JSON.stringify(this.state.filterColumnAttrs));
        let dsView = match.params.dsView;
        if (dsHome && dsHome.dsViews && dsHome.dsViews[dsView] && dsHome.dsViews[dsView].columns) {
            let initialHeaderFilter = [];
            let _id = ""; 
            let columns = Object.values(dsHome.dsViews[dsView].columns);
            const params = new URLSearchParams(queryString);
            //Iterate through params and keep on populating the initialHeaderFilter accordingly.
            let entries = params.entries();
            for (const [key, value] of entries) {
                console.log(`${key}: ${value}`);
                if (key === "_id") {
                    _id = value;
                    // once I get the _id field in the query string, only that row will be displayed.
                    // There is no meaning of filter there after, so reset it and go out of loop.
                    initialHeaderFilter = [];
                    //No need to show filter when user is viewing single row.
                    showFilter = false;
                    break;
                }
                if (key === "chronologyDescending") {
                    chronologyDescending = value.toLowerCase() === "true";
                    continue;
                }
                if (key === "hdrSorters") {
                    try {
                        let sorters = JSON.parse(value);
                        initialSort = sorters;
                    } catch (e) {
                        console.error("Error parsing hdrSorters:", e);
                    }
                    continue;
                }
                if (key === "filterColumnAttrs") {
                    try {
                        let fca = JSON.parse(value);
                        filterColumnAttrs = fca;
                    } catch (e) {
                        console.error("Error parsing filterColumnAttrs:", e);
                    }
                    continue;
                }
                if (key === "fetchAllMatchingRecords") {
                    this.fetchAllMatchingRecordsFlag = value.toLowerCase() === "true";
                    continue;
                }
                if (key === "pageSize") {
                    let ps = parseInt(value);
                    if (ps && ps > 0) {
                        pageSize = ps;
                    }
                    continue;
                }
                if (columns.includes(key)) {
                    showFilter = true;
                    initialHeaderFilter.push({
                        "field": key,
                        "value": value
                    })
                }
            }
            localStorage.setItem("chronologyDescending", JSON.stringify(chronologyDescending));
            this.setState({
                ...this.state,
                queryString: queryString,
                _id: _id,
                initialHeaderFilter: initialHeaderFilter,
                pageSize: pageSize,
                initialSort: initialSort,
                filterColumnAttrs: filterColumnAttrs,
                showAllFilters: showFilter,
                chronologyDescending: chronologyDescending,
                refresh: this.state.refresh + 1
            });
        }
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
        //Render plotly graphs
        this.renderPlotlyInCells();
    }

    // Since we generate html after editing, we need to attach
    // the handlers again. 
    applyHtmlLinkAndBadgeClickHandlers() {
        return this._dom.applyHtmlLinkAndBadgeClickHandlers();
    }
    applyHighlightJsBadge() {
        return this._dom.applyHighlightJsBadge();
    }

    renderPlotlyInCells() {
        return this._dom.renderPlotlyInCells();
    }

    fixImgSizeForClipboard(output) {
        return this._clipboard.fixImgSizeForClipboard(output);
    }

    normalizeAllImgRows() {
        return this._dom.normalizeAllImgRows();
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
        /* redraw is triggered because we are now setting the width 
           with some more logic in col.formatter. When a column is resized,
           we want the cells to readjust. 
        */
        let me = this;
        this.timers["column-resized-recently"] = setTimeout(() => {
            me.columnResizedRecently = false;
            me.timers["column-resized-recently"] = null;
        }, 1000)
        this.columnResizedRecently = true;
        this.ref.table.redraw(true);
        return;
        /* Not sure what this was for, commenting it for now. */
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
        if (!this.state.connectedState || !this.state.dbconnectivitystate) {
            return
        }
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
        if (!this.state.dbconnectivitystate) return false;
        return this.cellEditCheckForConflicts(cell);
    }
    cellForceEditTrigger (cell) {
        console.log("In cellForceEditTrigger");
        if (!this.state.singleClickEdit)  return false;
        if (this.state.disableEditing) return false;
        if (!this.state.connectedState) return false;
        if (!this.state.dbconnectivitystate) return false;
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
                this.renderPlotlyInCells();
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

    urlGeneratorFunction = (e, cell, forView) => {
        if (forView) {
            this.urlGeneratorFunctionForView(e, cell);
        } else {
            this.urlGeneratorFunctionForRow(e, cell);
        }
    }

    urlGeneratorFunctionForRow = (e, cell) => {
        const { match } = this.props;
        // Get cell Id
        let _id = "";
        // Make the Url for the cell Id. 
        _id = cell.getRow().getData()['_id'];
        //Generate the Url
        let finalUrlWithQueryString = window.location.origin + match.url;
        if (_id) {
            finalUrlWithQueryString += '?' + `_id=${_id}`;
        }
        // Call the copy to clipboard function with the url.
        console.log("Url copied for row:", finalUrlWithQueryString);
        this.copyTextToClipboard(finalUrlWithQueryString);
    }

    urlGeneratorFunctionForView = (e, cell) => {
        const { match } = this.props;
        /**
         * If the current view is of just a single row,
         * no matter the filter in the headers,
         * call the urlGenerator function for single row.
         */
        if (this.state._id) {
            this.urlGeneratorFunctionForRow(e, cell);
            return;
        }
        //Get all current header filters
        let currentHeaderFilters = this.ref.table.getHeaderFilters();
        let queryParamsObject = {};
        for (let headerFilter of currentHeaderFilters) {
            if (headerFilter.field && headerFilter.value && headerFilter.type === 'like') {
                queryParamsObject[headerFilter.field] = headerFilter.value;
            }
        }
        //Get table column sorters and add it to queryParamsObject
        let hdrSortersTmp = this.ref.table.getSorters();
        let hdrSorters = [];
        for (let i = 0; i < hdrSortersTmp.length; i++) {
            let sorter = {};
            sorter.column = hdrSortersTmp[i].field;
            sorter.dir = hdrSortersTmp[i].dir;
            hdrSorters.push(sorter);
        }
        if (hdrSorters.length) {
            queryParamsObject["hdrSorters"] = JSON.stringify(hdrSorters);
        }
        // Get filter column attributes and add it to query parameters object.
        let filterColumnAttrs = {};
        let cols = this.ref.table.getColumns();
        for (let i = 0; i < cols.length; i++) {
            let field = cols[i].getField();
            let attrsForField = {};
            if (!cols[i].isVisible()) {
                attrsForField.hidden = true;
            }
            attrsForField.width = cols[i].getWidth();
            filterColumnAttrs[field] = attrsForField;
        }
        queryParamsObject["filterColumnAttrs"] = JSON.stringify(filterColumnAttrs);
        // Get show matches setting
        queryParamsObject["fetchAllMatchingRecords"] = this.fetchAllMatchingRecordsFlag ? this.fetchAllMatchingRecordsFlag : false;
        // Get the page size and add it to query parameters object.
        queryParamsObject["pageSize"] = this.ref.table.getPageSize() ? this.ref.table.getPageSize() : 30;
        // Get the table chronology and add it to query parameters object.
        queryParamsObject["chronologyDescending"] = this.state.chronologyDescending ? this.state.chronologyDescending : false;
        //Make queryParams out of the header filters.
        const queryParams = new URLSearchParams(Object.entries(queryParamsObject));
        //Generate the Url
        let finalUrlWithQueryString = window.location.origin + match.url;
        /* In case there was no filter set and user generated the url for base view.
        In such cases, No need to append anything. Just proceed with the current url*/
        if (queryParams.toString()) {
            finalUrlWithQueryString += '?' + queryParams.toString();
        }
        console.log("Url copied for view:", finalUrlWithQueryString);
        this.copyTextToClipboard(finalUrlWithQueryString);
    }

    /**
     * Given a text, this function copies the text to the clipboard.
     * It uses navigator.clipboard for the latest browsers. 
     * In case of older browser, it falls back to document.execCommand.
     * Finally, it shows the modal of success or failure based on the copy to clipboard status.
     */
    copyTextToClipboard = (text) => {
        return this._clipboard.copyTextToClipboard(text);
    }

    showCopiedNotification(isSuccess) {
        return this._clipboard.showCopiedNotification(isSuccess);
    }

    showClipboardActionMessageModal(isSuccess, url) {
        let modalStatus = this.state.modalStatus;
        if (isSuccess) {
            modalStatus = `<b style="color:green">URL copied succesfully to clipboard</b>`;
        } else {
            if (url) {
                modalStatus = `<b style="color:red">Copy url to clipboard failed.</b> <br/> Please copy the following Url manually: <br/> ${url}`;
            } else {
                modalStatus = `<b style="color:red">Failed to generate Url.</b>`;
            }
        }
        let modalQuestion = <div dangerouslySetInnerHTML={{ __html: modalStatus }} />;
        this.setState({
            modalTitle: "Copy URL status",
            modalQuestion: modalQuestion,
            modalStatus: modalStatus,
            modalOk: "Dismiss",
            modalCallback: (confirmed) => { this.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
            showModal: true
        });
    }

    async addRow (e, cell, data, pos) {
        const { dispatch, match, user, dsHome } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        if (!data) {
            data = {};
            try {
                // We simply add the user-name if per-row access control is enabled for this dataset. 
                if (dsHome.dsViews[dsView].perRowAccessConfig.enabled && dsHome.dsViews[dsView].perRowAccessConfig.column) {
                    data[dsHome.dsViews[dsView].perRowAccessConfig.column] = user.user;
                }
            } catch (e) {}
        }
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
        return this._clipboard.myCopyToClipboard(this.ref);
    }

    copyToClipboard () {
        // You have to also set 'clipboard' to true in table options.
        //this.ref.table.copyToClipboard();
        return this._clipboard.copyToClipboard(this.ref);
    }

    // https://stackoverflow.com/questions/34191780/javascript-copy-string-to-clipboard-as-text-html
    copyFormatted (element, html) {
        return this._clipboard.copyFormatted(element, html);
    }

    copyFormattedBetter (container) {
        return this._clipboard.copyFormattedBetter(container);
    }


    copyCellToClipboard (e, cell) {
        return this._clipboard.copyCellToClipboard(e, cell);
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

    downloadXlsx(useQuery) {
        const { dispatch, match, user } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let query = [];
        if (useQuery) {
            /**
             * This is special case where there in frontend we are viewing just the single row.
             * In such case, whatever the query might be in the header, we need to download only the single row.
             */
            if (this.state._id) {
                query.push({
                    field: "_id",
                    value: this.state._id
                });
            } else {
                query = this.ref.table.getHeaderFilters();
            }
        }
        // XXX: Doesn't work from the front end.
        // this.ref.table.download("xlsx", "data.xlsx", { sheetName: "export" })

        dispatch(dsActions.downloadXlsx(dsName, dsView, user.user, query));
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
            this.renderPlotlyInCells();
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
    
    /* Delete Column Start */
    deleteColumnHandler(e, cell, confirmed, columnField) {
        const { dispatch, match, user } = this.props;
        const dsName = match.params.dsName;
        const dsView = match.params.dsView;
        console.log("Delete column handler called:", confirmed);
        if (confirmed) {
            dispatch(dsActions.deleteColumn(dsName, dsView, user.user, columnField))
                .then(() => {
                    // Force a refresh of the table data
                    this.setState({ refresh: this.state.refresh + 1 });
                })
                .catch(error => {
                    console.error("Delete column failed:", error);
                });
        }
        this.setState({ showModal: false });
    }

    deleteColumnQuestion(e, cell) {
        const columnField = cell.getColumn().getField();
        if (this.isKey(columnField)) {
            // If it's a key column, show an error message without a cancel button
            this.setState({
                modalTitle: "Error",
                modalQuestion: `This is a Key Column. This Column cannot be deleted.`,
                modalOk: "Dismiss",
                modalCancel: "Cancel",
                modalCallback: (confirmed) => this.setState({ showModal: false }), // Just close the modal
                showModal: true,
            });
        } else {
            // Proceed with the existing logic for non-key columns
            this.setState({
                modalTitle: "Delete current column?",
                modalQuestion: `This will delete the current column: ${columnField}. Please confirm. Undoing support is not yet available!`,
                modalOk: "Delete",
                modalCancel: "Cancel",
                modalCallback: (confirmed) => this.deleteColumnHandler(e, cell, confirmed, columnField), // Pass cell and columnField
                showModal: true,
                //grayOutModalButtons: false,
            });
        }
    }
 
    deleteColumnStatus() {
        const { dispatch, dsHome } = this.props;
        let status = '';
        try {
            Object.entries(dsHome.dsDeletes || {}).forEach(([k, deleteObj]) => {
                if (deleteObj.deleteStatus === 'done' && deleteObj.serverStatus) {
                    if (deleteObj.serverStatus.status === 'fail') {
                        status += `Delete failed on server `;
                    } else if (deleteObj.serverStatus.status === 'success') {
                        let column = deleteObj.deleteTracker.column;
                        if (column && column.delete) {
                            column.delete();
                        }
                        dispatch({ type: dsConstants.DELETE_SINGLE_DELETE_TRACKER, _id: k });

                        // Force UI update
                        this.setState((prevState) => ({ forceUpdateKey: prevState.forceUpdateKey + 1 }));
                    }
                } else if (deleteObj.deleteStatus === 'fail') {
                    status += `Delete API failed`;
                }
            });
        } catch (e) {
            console.error("Error in deleteColumnStatus:", e);
        }

        return <b style={{ color: "red" }}> {status} </b>;
    }
    /*Delete Column End*/

    /*Add Column Start*/
    addColumnQuestion(referenceColumn) {
        const { dispatch } = this.props;
        this.setState({
            modalTitle: "Add New Column",
            showModal: true,
            toggleModalOnClose: false,
            modalQuestion:
                <AddColumnForm
                    visible={true}
                    position={this.state.newColumnPosition}  //Pass the position correctly
                    referenceColumn={referenceColumn}
                    dsName={this.props.match.params.dsName}
                    dsView={this.props.match.params.dsView}
                    dsUser={this.props.user.user}
                    columnName={this.state.newColumnName}
                    onCancel={() => this.setState({ showModal: false })}
                    onChange={(e) => {
                        console.log("New column name: ", e.target.value);
                        this.setState({ newColumnName: e.target.value });
                    }}
                    onPositionChange={(position) => { //Sync position correctly
                        console.log("Selected position:", position);
                        this.setState({ newColumnPosition: position });
                    }}
                />,
            modalCallback: (confirmed) => {
                if (!confirmed) {
                    const addTracker = `${this.props.match.params.dsName}_${this.state.newColumnName}`;
                    dispatch({ type: dsConstants.CLEAR_COLUMN_ADD_TRACKER, addTracker });
                    this.setState({ showModal: false, newColumnName: "", newColumnPosition: "", modalError: "", grayOutModalButtons: false, toggleModalOnClose: true });
                    return;
                }
                this.addColumnHandler({
                    dsName: this.props.match.params.dsName,
                    dsView: this.props.match.params.dsView,
                    dsUser: this.props.user.user,
                    position: this.state.newColumnPosition,  // Ensure position is included
                    referenceColumn: referenceColumn,
                    columnAttrs: {}
                });
            },
            modalOk: null,
            modalCancel: null
        });
    }

    addColumnHandler = async ({ dsName, dsView, dsUser, referenceColumn, columnAttrs }) => {
        const { dispatch } = this.props;
        const { newColumnName, newColumnPosition } = this.state; // Ensure correct position extraction
        if (!newColumnName) {
            this.setState({ modalError: "Column name cannot be empty!" });
            return;
        }
        try {
            console.log("Adding new column:", { newColumnName, newColumnPosition });
            const response = await dispatch(dsActions.addColumn({
                dsName,
                dsView,
                dsUser,
                columnName: newColumnName,
                position: newColumnPosition || "left",  // Ensure position is always defined
                referenceColumn,
                columnAttrs
            }));

            if (response && response.message) {
                console.log("Column added successfully. Refreshing UI...");
                this.setState({
                    showModal: false,
                    toggleModalOnClose: true,
                    modalError: null,
                    newColumnName: "",
                    newColumnPosition: "left", // Reset position
                    grayOutModalButtons: false
                });
            } else {
                console.log("Failed to add column:", response);
                this.setState({
                    grayOutModalButtons: false,
                    modalError: response.error || "Failed to add column. Please try again."
                });
            }
        } catch (error) {
            console.error("Error adding column:", error);
            this.setState({
                grayOutModalButtons: false,
                modalError: "Failed to add column. Please try again."
            });
        }
    };

    addColumnStatus() {
        const { dispatch, dsHome } = this.props;
        let status = '';
        try {
            Object.entries(dsHome.dsColumnAdds || {}).forEach(([key, addObj]) => {
                if (addObj.addStatus === 'done') {
                    if (addObj.serverStatus && addObj.serverStatus.status === 'fail') {
                        status += `Add failed on server `;
                    } else if (addObj.serverStatus && addObj.serverStatus.status === 'success') {
                        const column = addObj.columnName || key; // Ensure correct column name usage
                        if (column) {
                            let table = this.ref.table;
                            table.addColumn({ title: column, field: column });
                        }
                        dispatch({ type: dsConstants.CLEAR_COLUMN_ADD_TRACKER, columnField: key });
                    }
                } else if (addObj.addStatus === 'fail') {
                    const column = addObj.columnName || key; // Use correct column name
                    status = `Column addition failed!!! ${column} already exists.`;
                }
            });
        } catch (e) {
            console.error("Error in addColumnStatus:", e);
        }
        if (this.state.modalError !== status) {
            this.setState({ modalError: status });
        }
        return '';
    }
    
    /* Add Column End */

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
                ...authHeader()
            },
            credentials: "include"
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
                                ...authHeader()
                            },
                            credentials: "include"
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
        if (this._jira && this._jira.handleJiraFormChange) {
            try { return this._jira.handleJiraFormChange(obj); } catch (e) { console.error('JIRA helper failed', e); }
        }
    }

    formFinalJiraFormData() {
        if (this._jira && this._jira.formFinalJiraFormData) {
            try { return this._jira.formFinalJiraFormData(); } catch (e) { console.error('JIRA helper failed', e); }
        }
        return {};
    }

    async submitJiraFormChange(confirmed, _id, selectorObj) {
        if (this._jira && this._jira.submitJiraFormChange) {
            try { return await this._jira.submitJiraFormChange(confirmed, _id, selectorObj); } catch (e) { console.error('JIRA helper failed', e); }
        }
    }

    /**
     * Given all the defaults defined in the backend, this function will return the default values for the given projectName
     * @param {Array<Object>} defaultValuesOfAllProjects 
     * @param {string} jiraProjectName 
     * @returns {object}
     */
    getDefaultTypeFieldsAndValuesForProject(defaultValuesOfAllProjects, jiraProjectName) {
        for (let projectObj of defaultValuesOfAllProjects) {
            if (projectObj.key == jiraProjectName) {
                return projectObj;
            }
        }
        return null;
    }

    async convertToJiraRow(e, cell) {
        if (this._jira && this._jira.convertToJiraRow) {
            try { return await this._jira.convertToJiraRow(e, cell); } catch (e) { console.error('JIRA helper failed', e); }
        }
        let self = this
        const { match, dsHome, user } = this.props;
        let dsView = match.params.dsView;
        let dsName = match.params.dsName;
        let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
        let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
        let jiraProjectName = dsHome.dsViews[dsView].jiraProjectName;
        let dsUser = user.user;
        if (!jiraProjectName) {
            this.setState({
                modalTitle: "Convert JIRA status",
                modalQuestion: `Jira Project Name not configured. Please go to "Edit-view" of the dataset and add Jira Project Name same as that in JIRA. Reload this page.`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
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
        let projectsMetaData = await dsService.getProjectsMetaData({ dsName, dsView, dsUser, jiraAgileConfig, jiraConfig, jiraProjectName })
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
        let copyOfDefaults = JSON.parse(JSON.stringify(this.getDefaultTypeFieldsAndValuesForProject(dsHome.defaultTypeFieldsAndValues.value.projects, jiraProjectName).issuetypes));
        this.jiraFormData = {
            ...this.jiraFormData,
            ...copyOfDefaults
        }
        if (jiraAgileConfig && jiraAgileConfig.label) {
            this.jiraFormData.JIRA_AGILE_LABEL = jiraAgileConfig.label
        }
        this.fillLocalStorageItemData(projectsMetaData.issuetypes)
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
        if (this._jira && this._jira.fillLocalStorageItemData) {
            try { return this._jira.fillLocalStorageItemData(issueTypes); } catch (e) { console.error('JIRA helper failed', e); }
        }
    }

    validateAndGetDefaultValue(issueTypes, issueType, field, value) {
        if (this._jira && this._jira.validateAndGetDefaultValue) {
            try { return this._jira.validateAndGetDefaultValue(issueTypes, issueType, field, value); } catch (e) { console.error('JIRA helper failed', e); }
        }
        return { isValidated: false, defaultValue: null };
    }

    formInitialJiraForm(rowData, jiraConfig, jiraAgileConfig) {
        if (this._jira && this._jira.formInitialJiraForm) {
            try { return this._jira.formInitialJiraForm(rowData, jiraConfig, jiraAgileConfig); } catch (e) { console.error('JIRA helper failed', e); }
        }
    }

    isJiraRow(data, jiraConfig, jiraAgileConfig) {
        if (this._jira && this._jira.isJiraRow) {
            try { return this._jira.isJiraRow(data, jiraConfig, jiraAgileConfig); } catch (e) { console.error('JIRA helper failed', e); }
        }
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
        if (this._jira && this._jira.addJiraRow) {
            try { return await this._jira.addJiraRow(e, cell, type); } catch (e) { console.error('JIRA helper failed', e); }
        }
        let self = this
        const { match, dsHome, user } = this.props;
        let dsView = match.params.dsView;
        let dsName = match.params.dsName;
        let dsUser = user.user;
        let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
        let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
        let jiraProjectName = dsHome.dsViews[dsView].jiraProjectName;
        if (!jiraProjectName) {
            this.setState({
                modalTitle: "Add JIRA status",
                modalQuestion: `Jira Project Name not configured. Please go to "Edit-view" of the dataset and add Jira Project Name same as that in JIRA. Reload this page.`,
                modalOk: "Dismiss",
                modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
                showModal: true
            })
            return
        }
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
        let projectsMetaData = await dsService.getProjectsMetaData({ dsName, dsView, dsUser, jiraAgileConfig, jiraConfig, jiraProjectName })
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
        let copyOfDefaults = JSON.parse(JSON.stringify(this.getDefaultTypeFieldsAndValuesForProject(dsHome.defaultTypeFieldsAndValues.value.projects, jiraProjectName).issuetypes))
        this.jiraFormData = {
            ...this.jiraFormData,
            ...copyOfDefaults
        }
        if (jiraAgileConfig && jiraAgileConfig.label) {
            this.jiraFormData.JIRA_AGILE_LABEL = jiraAgileConfig.label
        }
        this.fillLocalStorageItemData(projectsMetaData.issuetypes)
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
        if (this._jira && this._jira.checkIfValid) {
            try { return this._jira.checkIfValid(rowData, type, jiraConfig, jiraAgileConfig); } catch (e) { console.error('JIRA helper failed', e); }
        }
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
        if (this._jira && this._jira.getJiraId) {
            try { return this._jira.getJiraId(rowData, jiraConfig, jiraAgileConfig); } catch (e) { console.error('JIRA helper failed', e); }
        }
        return "";
    }

    async submitAddJira(confirmed, parentKey, parentSelectorObj) {
        if (this._jira && this._jira.submitAddJira) {
            try { return await this._jira.submitAddJira(confirmed, parentKey, parentSelectorObj); } catch (e) { console.error('JIRA helper failed', e); }
        }
    }

    updateLocalStorage(jiraFormData) {
        if (this._jira && this._jira.updateLocalStorage) {
            try { return this._jira.updateLocalStorage(jiraFormData); } catch (e) { console.error('JIRA helper failed', e); }
        }
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
        if (this._tabulator && this._tabulator.setColumnDefinitions) {
            try { return this._tabulator.setColumnDefinitions(); } catch (e) { console.error('Tabulator helper failed', e); }
        }
        return [];
    }

    ajaxResponse (url, params, response) {
        // console.log(`In ajaxResponse, params: ${JSON.stringify(params, null, 4)}, url: ${url},  response.total: ${response.total}, response.reqCount: ${response.reqCount}, state.initialHeaderFilter: ${JSON.stringify(this.state.initialHeaderFilter, null, 4)}, moreMatchingDocs: ${response.moreMatchingDocs}`);
        if ((response.reqCount == this.reqCount) || (response.reqCount == 0)) {
            this.setState({ totalRecs: response.total, moreMatchingDocs: response.moreMatchingDocs});
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
                params.fetchAllMatchingRecords = this.fetchAllMatchingRecordsFlag;
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
            let url = `${config.apiUrl}/ds/view/${this.props.match.params.dsName}/${dsView}/${user.user}`;
            if (this.state._id) {
                url += `/${this.state._id}`;
            }
            s2 = <Row>
                        <div id="tabulator">
                            <MyTabulator
                                columns={columns}
                                data={[]}
                                options={{
                                    ajaxURL: url,
                                    ajaxConfig: {
                                        headers: {
                                            ...authHeader(),
                                            "Content-Type": "application/json",
                                        },
                                        credentials: 'include'
                                    },
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
                                    headerFilterLiveFilterDelay: 1000,
                                    initialHeaderFilter: this.state.initialHeaderFilter,
                                    initialSort: JSON.parse(JSON.stringify(this.state.initialSort)), // it'll mess up the state otherwise!
                                    headerSortTristate:true,
                                    columnResized: this.columnResized,
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
            if (this.state.filter !== filter) {
            /**This case is hit when somebody has cleared the filter in the UI.
             * Meaning some filter was set already and we are clearing it.
             * In such case, we need to clear the initialHeaderFilter
             */
                initialHeaderFilter = [];
                initialSort = [];
                filterColumnAttrs = {};
                this.setState({ filter, initialHeaderFilter, initialSort, filterColumnAttrs, refresh: this.state.refresh + 1});
            }
            if (newUrl !== this.props.location.pathname)
                history.push(newUrl);
        }

        this.applyFilterColumnAttrs();
    }

    applyFilterColumnAttrs () {
        try {
            if (this.columnResizedRecently) {
                // This will allow you to resize columns while in filters
                // and not immediately snap back to the stored filter values. 
                // This is needed because we redraw the table when columnResized callback is called. 
                return;
            }
            console.log("Applying for: ", this.state.filter);
            if (!this.ref || !this.ref.table)
                return;
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

    displayConnectedStatus(){
        if ( this.state.connectedState ) {
            if ( this.state.dbconnectivitystate ){
                return <span><i class='fas fa-server'></i> <b>Connection Status:</b> <b style={{ 'color': 'darkgreen' }}>Connected</b>&nbsp;|</span>
            } else {
                return <span><i class='fas fa-server'></i> <b>Connection Status:</b> <b style={{ 'color': 'red' }}>Disconnected</b> <i>(Database connectivity is down)</i>&nbsp;|</span>
            }
        } else{
            return <span><i class='fas fa-server'></i> <b>Connection Status:</b> <b style={{ 'color': 'red' }}>Disconnected</b><i>(Server connectivity is down)</i>&nbsp;|</span>

        }
    }

    fetchAllMatchingRecords() {
        this.fetchAllMatchingRecordsFlag = !this.fetchAllMatchingRecordsFlag;
        this.ref.table.setData();
    }

    render () {
        const { match, dsHome, location } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let me = this; 
        this.fixOneTimeLocalStorage();
        let jiraRefreshButton = "";
        console.log("In DsView render..");
        if (document.title !== dsName) {
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
        this.processFilterViaUrl(location.search);
        //this.retainColumnAttrs();
        return (
            <div>
                {this.state.showNotification && <Notification show={this.state.showNotification} type={this.state.notificationType} message={this.state.notificationMessage} showIcon={this.state.showIconsInNotification} />}
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                        <Link to={`/ds/${match.params.dsName}/${match.params.dsView}`}>
                            <h3 style={{ 'float': 'center' }}> {match.params.dsName}</h3>
                        </Link>
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
                    {this.deleteColumnStatus()}   
                    {this.addColumnStatus()}
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

                        <input type="checkbox" disabled={this.state._id ? true : false} label="&nbsp;Show filters" checked={this.state.showAllFilters} onChange={(event) => {
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
                    {
                        (this.ref && this.ref.table && this.ref.table.getHeaderFilters().length > 0) ? 
                        (this.fetchAllMatchingRecordsFlag ? 
                            (<b><i class='fas fa-clone'></i> Total matching records: {this.state.totalRecs} |  </b>) :
                            (this.state.moreMatchingDocs ? 
                                (<b><i class='fas fa-clone'></i> Top matching records: {this.state.totalRecs-1}+ | </b>):
                                (<b><i class='fas fa-clone'></i> Top matching records: {this.state.totalRecs} | </b>)
                            )
                        ) : 
                        (<b><i class='fas fa-clone'></i> Total records: {this.state.totalRecs} |  </b>)
                    }

                    {
                        this.ref && this.ref.table && this.ref.table.getHeaderFilters().length > 0 ? 
                        (this.fetchAllMatchingRecordsFlag ? 
                            (<button className="btn btn-link" onClick={this.fetchAllMatchingRecords}> 
                                <i class='fa fa-download'></i> Fetch top matches only | 
                            </button>): 
                            (<button className="btn btn-link" onClick={this.fetchAllMatchingRecords}> 
                                <i class='fa fa-download'></i> Fetch all matches | 
                            </button>)
                        ) : 
                        ''
                    }
                    <Link to={`/dsEditLog/${match.params.dsName}`} target="_blank"><i class='fas fa-file-alt'></i> <b>Edit-log</b></Link> |&nbsp;
                    <Link to={`/dsViewEdit/${match.params.dsName}/${match.params.dsView}`} target="_blank"><i class='fas fa-edit'></i> <b>Edit-view</b></Link> |&nbsp;
                    <Link to={`/dsBulkEdit/${match.params.dsName}`} target="_blank"><i class='fas fa-edit'></i> <b>Bulk-edit</b></Link> |&nbsp;
                    <Link to={`/dsAttachments/${match.params.dsName}`} target="_blank"><i class='fas fa-file-alt'></i> <b>Attachments</b></Link> |&nbsp;
                    {this.displayConnectedStatus()}
                    <button className="btn btn-link" onClick={() => { this.ref.table.setData() }}> <i class='fas fa-redo'></i>&nbsp;<b>Refresh</b> </button>
                </Col>
                </Row>
                {this.step2()}
                <Modal show={this.state.showModal}
                    onClose={this.toggleModal} title={this.state.modalTitle} cancel={this.state.modalCancel} ok={this.state.modalOk} toggleModalOnClose={this.state.toggleModalOnClose} grayOutModalButtons={this.state.grayOutModalButtons}>
                    {this.state.modalQuestion}
                    {this.state.modalError}
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
