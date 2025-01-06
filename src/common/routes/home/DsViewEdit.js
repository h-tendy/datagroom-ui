import React, { Component } from 'react'
import { Row, Col, Form, Button, Checkbox } from 'react-bootstrap'
import { connect } from 'react-redux';
import { dsActions } from '../../actions/ds.actions';
import { dsConstants } from '../../constants';
import MyTabulator from './MyTabulator';
import './simpleStyles.css';
import { dsHome } from '../../reducers/dsHome.reducer';
import Select from 'react-select';
import AccessCtrl from './DsViewEditAccessCtrl';
import PerRowAccessCtrl from './DsViewEditPerRowAccessCtrl';
import { authHeader } from '../../helpers';


let MarkdownIt = new require('markdown-it')({
    linkify: true,
    html: true
}).use(require('markdown-it-bracketed-spans')).use(require('markdown-it-attrs')).use(require('markdown-it-container'), 'code');

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}

class DsViewEdit extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: null,
            range: "",
            dsName: "",
            firstTime: true,
            filterButtonText: 'Enable Filters',
            editingButtonText: 'Disable Editing',
            refreshAfterRender: false,
            jiraProjectNameEnabled: null,
            jiraProjectName: "",
            jira: null,
            jiraAgile: null,
            jql: "",
            jiraFieldMapping: '# Jira keys: "key", "summary", "type", "assignee", "severity", "priority", "reporter", "foundInRls", "created", "rrtTargetRls", "targetRls", "status", "feature", "rzFeature", "versions", "parentKey", "parentSummary", "parent", "subtasks", "subtasksDetails", "dependsLinks", "implementLinks", "packageLinks", "relatesLinks", "testLinks", "coversLinks", "defectLinks", "automatesLinks", "updated", "votes", "systemFeature", "labels", "phaseBugFound", "phaseBugIntroduced", "epic", "description", "Story Points", "Sprint Name", "jiraSummary", "fixVersions", "Agile Commit", "duedate", "targetRlsGx", "Assignee Manager", "Dev RCA Comments", "Agile Team"\n\n',
            jiraAgileLabel: "",
            jiraAgileBoardId: 0,
            jiraAgileFieldMapping: '# Jira keys: "key", "summary", "type", "assignee", "severity", "priority", "reporter", "foundInRls", "created", "rrtTargetRls", "targetRls", "status", "feature", "rzFeature", "versions", "parentKey", "parentSummary", "parent", "subtasks", "subtasksDetails", "dependsLinks", "implementLinks", "packageLinks", "relatesLinks", "testLinks", "coversLinks", "defectLinks", "automatesLinks", "updated", "votes", "systemFeature", "labels", "phaseBugFound", "phaseBugIntroduced", "epic", "description", "Story Points", "Sprint Name", "jiraSummary", "fixVersions", "Agile Commit", "duedate", "targetRlsGx", "Acceptance Criteria", "Agile Team"\n\n',
            dsDescription: null,
            widths: {},
            fixedHeight: null,
            setViewStatus: '',
            aclConfig: null,
            perRowAccessConfig: null,
            somethingChanged: 0,
            debounceTimers: {}
        };
        //this.widths = {};
        this.editors = {};
        this.ref = null;
        this.recordRef = this.recordRef.bind(this);
        this.pushColumnDefs = this.pushColumnDefs.bind(this);
        this.addCol = this.addCol.bind(this);
        this.showAllCols = this.showAllCols.bind(this);
        this.toggleSingleFilter = this.toggleSingleFilter.bind(this);
        this.setEditor = this.setEditor.bind(this);
        this.setEditorToFalse = this.setEditorToFalse.bind(this);
        this.setEditorToInput = this.setEditorToInput.bind(this);
        this.setEditorToTextArea = this.setEditorToTextArea.bind(this);
        this.setEditorToCodeMirror = this.setEditorToCodeMirror.bind(this);
        this.setEditorToDate = this.setEditorToDate.bind(this);
        this.setFormatter = this.setFormatter.bind(this);
        this.setFormatterToPlainText = this.setFormatterToPlainText.bind(this);
        this.setFormatterToTextArea = this.setFormatterToTextArea.bind(this)
        this.hideColumn = this.hideColumn.bind(this);
        this.setHdrFilterType = this.setHdrFilterType.bind(this);
        this.setHdrFilterTypeToNumber = this.setHdrFilterTypeToNumber.bind(this);
        this.setHdrFilterTypeToText = this.setHdrFilterTypeToText.bind(this);
        this.plusFiftyToWidth = this.plusFiftyToWidth.bind(this);
        this.editorParamsControl = this.editorParamsControl.bind(this);
        this.renderComplete = this.renderComplete.bind(this);
        this.setViewStatus = this.setViewStatus.bind(this);
    }
    componentDidMount () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        if ( !Object.keys(dsHome).length || !dsHome.dsViews || !dsHome.dsViews[dsView] ) {
            dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user)); 
        }
    }
    componentWillUnmount () {
        const { dispatch } = this.props;
        dispatch( { type: dsConstants.CLEAR_COLUMNS } );
        if (this.timer) {
            clearTimeout(this.timer)
        }
    }

    recordRef (ref) {
        // setting state is causing grief to the Tabulator component. 
        //this.setState({ ref });
        this.ref = ref;
        return true;
    }

    showAllCols () {
        let cols = this.ref.table.getColumns();
        for (let i = 0; i < cols.length; i++) {
            if (!cols[i].isVisible())
                cols[i].show();
        }
    }
    renderComplete () {
        let widths = {};
        let cols = this.ref.table.getColumns();
        for (let i = 0; i < cols.length; i++) {
            widths[cols[i].getField()] = cols[i].getWidth();
            //this.widths[cols[i].getField()] = cols[i].getWidth();
        }
        //console.log("Widths are: ", widths);
        this.setState({ widths });
    }

    async addCol (e, data) {
        const { dispatch, match, dsHome } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        console.log("Add col called..: ", data);
        if (!data) data = {};
        try {
            if (Object.keys(dsHome.dsColAdds[dsView]).length) {
                console.log("A col add is in progress..");
                return;
            }
        } catch (e) {}
        let col = await this.ref.table.addColumn({title: "", field: "", editableTitle: true});
        console.log("Col is: ", col);
    }

    pushColumnDefs () {
        const { dispatch, match, user } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        this.setState({ setViewStatus: '' });
        let currentDefs = JSON.parse(JSON.stringify(this.ref.table.getColumnDefinitions()));
        console.log("currentDefs from tabulator: ", currentDefs);
        let cols = this.ref.table.getColumns();
        for (let i = 0; i < cols.length; i++) {
            for (let j = 0; j < currentDefs.length; j++) {
                if (currentDefs[j].field === cols[i].getField()) {
                    currentDefs[j].width = cols[i].getWidth();
                    console.log("Set width: ", currentDefs[j].width);
                    break;
                }
            }
        }
        // Read header filters. 
        let hdrFilters = this.ref.table.getHeaderFilters();
        for (let i = 0; i < hdrFilters.length; i++) {
            for (let j = 0; j < currentDefs.length; j++) {
                if (currentDefs[j].field === hdrFilters[i].field) {
                    currentDefs[j].hdrFilter = hdrFilters[i];
                    break;
                }
            }
        }
        let filteredDefs = [];
        for (let i = 0; i < currentDefs.length; i++) {
            delete currentDefs[i].headerMenu;
            for (let j = 0; j < cols.length; j++) {
                if (currentDefs[i].field === cols[j].getField()) {
                    if (!cols[j].isVisible()) {
                        currentDefs[i].visible = false;
                    } else {
                        delete currentDefs[i].visible;
                    }
                }
            }
            currentDefs[i].editor = this.editors[currentDefs[i].field];
            // Just remove editorParms.values, showListOnEmpty, allowEmpty, multiselect 
            // if it is not autocomplete. 
            if (currentDefs[i].editor !== "autocomplete") {
                try {
                    delete currentDefs[i].editorParams.values;
                    delete currentDefs[i].editorParams.showListOnEmpty;
                    delete currentDefs[i].editorParams.allowEmpty;
                    delete currentDefs[i].editorParams.multiselect;
                } catch (e) {}
            }
            filteredDefs.push(currentDefs[i]);
        }
        let jiraColumns = {
            "Work-id": false,
            "Description": false
        }; let jiraColumnsPresent = true;
        let jiraFields = { 'key': 1, 'summary': 1, 'type': 1, 'assignee': 1, 'severity': 1, 'priority': 1, 'foundInRls': 1, 'reporter': 1, 'created': 1, 'rrtTargetRls': 1, 'targetRls': 1, 'status': 1, 'feature': 1, 'rzFeature': 1, 'versions': 1, 'parentKey': 1, 'parentSummary': 1, 'parent': 1, 'subtasks': 1, 'subtasksDetails': 1, 'dependsLinks': 1, 'implementLinks': 1, 'packageLinks': 1, 'relatesLinks': 1, 'testLinks': 1, 'coversLinks': 1, "defectLinks": 1, "automatesLinks": 1, 'updated': 1, 'votes': 1, 'systemFeature': 1, 'labels': 1, 'phaseBugFound': 1, 'phaseBugIntroduced': 1, 'epic': 1, 'description': 1, 'Story Points': 1, 'Sprint Name': 1, 'jiraSummary': 1, 'fixVersions': 1, 'Agile Commit': 1, "duedate": 1, "targetRlsGx": 1, "Acceptance Criteria": 1, "Assignee Manager": 1, "Dev RCA Comments": 1, "Agile Team": 1 };
        let dsFields = {};
        for (let i = 0; i < currentDefs.length; i++) {
            for (let key in jiraColumns) {
                if (currentDefs[i].field === key) {
                    jiraColumns[key] = true;
                }
            }
            dsFields[currentDefs[i].field] = 1;
        }
        for (let key in jiraColumns) {
            if (!jiraColumns[key]) {
                console.log("Unknown jira column: ", key);
                jiraColumnsPresent = false; 
                break;
            }
        }

        function validateMapping (jiraFieldMapping) {
            let ret = { status: true, error: '' };
            for (let key in jiraFieldMapping) {
                //if (key === "key") continue;
                if (!jiraFields[key]) {
                    ret.error = `Unknown Jira key: ${key}`;
                    ret.status = false;
                    break;
                }
                if (!dsFields[jiraFieldMapping[key]]) {
                    ret.error = `Unknown column in data-set: ${jiraFieldMapping[key]}`;
                    ret.status = false;
                }
            }
            return ret;
        }
        let jiraFieldMapping = {};
        if (this.state.jiraFieldMapping) {
            let lines = this.state.jiraFieldMapping.split('\n');
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (/^\s*#/.test(line)) continue;
                let m = line.match(/^\s*"(.*?)"\s*->\s*"(.*?)"\s*$/);
                if (m && (m.length >= 2)) {
                    let jiraKey = m[1], dsField = m[2];
                    jiraFieldMapping[jiraKey] = dsField;
                    continue;
                }
                m = line.match(/^\s*'(.*?)'\s*->\s*'(.*?)'\s*$/);
                if (m && (m.length >= 2)) {
                    let jiraKey = m[1], dsField = m[2];
                    jiraFieldMapping[jiraKey] = dsField;
                    continue;
                }

            }
            let ret = validateMapping(jiraFieldMapping);
            console.log("validate ret: ", ret);
            jiraColumnsPresent = ret.status;
            if (!ret.status) { 
                this.setState({ setViewStatus: "Jira validation failed!" });
                console.log("Validation failed")
                return;
            }
        }
        let jiraConfig = null;
        if (jiraColumnsPresent && this.state.jira && this.state.jql) {
            jiraConfig = {
                jira: true,
                jql: this.state.jql,
                jiraFieldMapping
            }
        }

        // Jira Agile config 

        let jiraAgileFieldMapping = {};
        if (this.state.jiraAgileFieldMapping) {
            let lines = this.state.jiraAgileFieldMapping.split('\n');
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (/^\s*#/.test(line)) continue;
                let m = line.match(/^\s*"(.*?)"\s*->\s*"(.*?)"\s*$/);
                if (m && (m.length >= 2)) {
                    let jiraAgileKey = m[1], dsField = m[2];
                    jiraAgileFieldMapping[jiraAgileKey] = dsField;
                    continue;
                }
                m = line.match(/^\s*'(.*?)'\s*->\s*'(.*?)'\s*$/);
                if (m && (m.length >= 2)) {
                    let jiraAgileKey = m[1], dsField = m[2];
                    jiraAgileFieldMapping[jiraAgileKey] = dsField;
                    continue;
                }

            }
            let ret = validateMapping(jiraAgileFieldMapping);
            console.log("validate ret: ", ret);
            jiraColumnsPresent = ret.status;
            if (!ret.status) {
                this.setState({ setViewStatus: "Jira validation failed!" });
                console.log("Validation failed")
                return;
            }
        }
        let jiraAgileConfig = null;
        if (jiraColumnsPresent && this.state.jiraAgile && this.state.jiraAgileLabel && this.state.jiraAgileBoardId) {
            jiraAgileConfig = {
                jira: true,
                label: this.state.jiraAgileLabel,
                boardId: parseInt(this.state.jiraAgileBoardId),
                jiraFieldMapping: jiraAgileFieldMapping
            }
        }

        let dsDescription = {
            dsDescription: this.state.dsDescription
        }
        let otherTableAttrs = {
            fixedHeight: this.state.fixedHeight
        }
        // XXX: Push all columns including invisible ones.
        currentDefs = filteredDefs;
        console.log("Will push these definitions: ", currentDefs);
        let jiraProjectName = null;
        if (this.state.jiraProjectNameEnabled && this.state.jiraProjectName) {
            jiraProjectName = this.state.jiraProjectName;
        }
        dispatch(dsActions.setViewDefinitions(dsName, dsView, user.user, currentDefs, jiraConfig, dsDescription, otherTableAttrs, this.state.aclConfig, jiraAgileConfig, jiraProjectName, this.state.perRowAccessConfig));
        this.timer = setTimeout(() => {
            dispatch(dsActions.clearViewDefs())
        }, 2000)
        // Push the widths into the table's current definitions as well
        for (let j = 0; j < currentDefs.length; j++) {
            let cols = this.ref.table.getColumns();
            for (let i = 0; i < cols.length; i++) {
                if (currentDefs[j].field == cols[i].getField()) {
                    let width = cols[i].getWidth(); 
                    this.ref.table.updateColumnDefinition(currentDefs[j].field, { width });
                    break;
                }
            }    
        }

    }

    setViewStatus () {
        const { match, dsHome } = this.props;
        let status = '';
        try {
            if (dsHome.dsSetView.status === "fail") {
                status = dsHome.dsSetView.serverStatus.message;
            }
        } catch (e) {};
        if (this.state.setViewStatus) status = this.state.setViewStatus;
        if (status)
            return <b style={{color: "red"}}> {status} </b>;
        try {
            if (dsHome.dsSetView.status === "success" && dsHome.dsSetView.serverStatus.status === "success") {
                status = `success at ${new Date()}`;
            }
        } catch (e) {};
        return <b style={{color: "green"}}> {status} </b>;
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

    hideColumn (e, column) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        if (!this.isKey(column.getField()))
            column.hide();
    }

    setEditor (e, column, editor) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let currentDefs = this.ref.table.getColumnDefinitions();
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                let width = column.getWidth(); // For some weird reason, width gets lost. Hence. 
                this.editors[column.getField()] = editor;
                if (editor === "codemirror" || editor === "date") editor = "textarea";
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {editor, width});
                break;
            }
            //this.ref.table.updateColumnDefinition(currentDefs[j].field, {editor: newVal});
        }
        //this.ref.table.setColumns(currentDefs);
        //currentDefs = this.ref.table.getColumnDefinitions();
    }

    setEditorToInput (e, column) {
        this.setEditor(e, column, 'input');
    }

    setEditorToTextArea (e, column) {
        this.setEditor(e, column, 'textarea');
    }

    setEditorToCodeMirror (e, column) {
        this.setEditor(e, column, 'codemirror');
    }

    setEditorToAutocomplete (e, column) {
        this.setEditor(e, column, 'autocomplete');
    }

    setEditorToDate (e, column) {
        this.setEditor(e, column, 'date');
    }

    setEditorToFalse (e, column) {
        this.setEditor(e, column, false);
    }

    plusFiftyToWidth (e, column) {
        console.log("Column: ", column.getWidth());
        let curWidth = column.getWidth();
        column.setWidth(curWidth + 50);
    }

    markdownFormatter (cell, formatterParams) {
        let value = cell.getValue();
        if (typeof value != "string") return value;
        console.log("Value is: ", value);
        value = MarkdownIt.render(value);
        return `<div style="white-space:normal;word-wrap:break-word;">${value}</div>`;
    }

    setFormatter (e, column, formatter) {
        let currentDefs = this.ref.table.getColumnDefinitions();
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {formatter});
                break;
            }
        }
    }

    setFormatterToPlainText (e, column) {
        this.setFormatter(e, column, 'plaintext');
    }

    setFormatterToTextArea (e, column) {
        this.setFormatter(e, column, 'textarea');
    }

    setHdrFilterType (e, column, headerFilterType) {
        let currentDefs = this.ref.table.getColumnDefinitions();
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {headerFilterType});
                break;
            }
        }
    }
    setHdrFilterTypeToNumber (e, column) {
        this.setHdrFilterType(e, column, 'number');
    }
    setHdrFilterTypeToText (e, column) {
        this.setHdrFilterType(e, column, 'input');
    }
    setHozAlign(e, column, hozAlign) {
        let currentDefs = this.ref.table.getColumnDefinitions();
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {hozAlign});
                break;
            }
        }
    }
    setVertAlign(e, column, vertAlign) {
        let currentDefs = this.ref.table.getColumnDefinitions();
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {vertAlign});
                break;
            }
        }
    }

    toggleSingleFilter (e, column) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let currentDefs = this.ref.table.getColumnDefinitions();
        //console.log("Current definitions: ", currentDefs);
        //console.log("Column: ", column);
        console.log("Column: ", column.getWidth());
        let cols = this.ref.table.getColumns();
        let newVal;
        for (let j = 0; j < currentDefs.length; j++) {
            if (currentDefs[j].field === column.getField()) {
                newVal = currentDefs[j].headerFilter === 'input' ? false : 'input';
                currentDefs[j].headerFilter = newVal;
                this.ref.table.updateColumnDefinition(currentDefs[j].field, {headerFilter: newVal});
                break;
            }
            // Uncomment both the below if you wish perfect columns.
            //currentDefs[j].width = cols[j].getWidth();
        }
        //this.ref.table.setColumns(currentDefs);
    }

    dsDescription () {
        const { match, dsHome } = this.props;
        let dsView = match.params.dsView;
        let initialDesc = "", me = this;
        try {
            // First time, set it from the store. Subsequent edits will remain in this.state.
            if (this.state.dsDescription === null) {
                if (dsHome.dsViews[dsView].dsDescription.dsDescription)
                    this.setState({dsDescription: dsHome.dsViews[dsView].dsDescription.dsDescription});
            }
        } catch (e) { }

        let retJsx = 
        <Row>
            <Col md={2} sm={2} xs={2}> 
                <b>Dataset Description: </b>
            </Col>
            <Col md={10} sm={10} xs={10}> 
                <Form.Control as="textarea" rows="3" defaultValue={this.state.dsDescription} onChange={(event) => {
                    let value = event.target.value;
                    let key = "__dg__dsDescription"
                    if (me.state.debounceTimers[key]) {
                        clearTimeout(me.state.debounceTimers[key]);
                    }
                    me.state.debounceTimers[key] = setTimeout(() => {
                        delete me.state.debounceTimers[key];
                        //if (!value) return;
                        me.setState({dsDescription: value})
                    }, 1000)
                }} />
            </Col>
        </Row>
        return retJsx;
    }

    editorParamsControl (col) {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let epc = "";

        try {
            let me = this;
            let columnDef = this.ref.table.getColumn(col.field).getDefinition();
            //console.log("editorParamsControl got called: ", columnDef);
            if (columnDef.editor === "autocomplete") {
                let valueStr = "", checked = true, condValues = false, condExprStr = "";
                try {
                    valueStr = columnDef.editorParams.values.join(', ');
                } catch (e) {}
                try {
                    checked = columnDef.editorParams.multiselect;
                } catch (e) {}
                try {
                    condValues = columnDef.editorParams.conditionalValues;
                } catch (e) {}
                try {
                    condExprStr = columnDef.editorParams.conditionalExprs.join('\n');
                } catch (e) {}
                epc = <div>
                        Values:
                        <Form.Control type="text" defaultValue={valueStr} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers[col.field]) {
                                    clearTimeout(me.state.debounceTimers[col.field]);
                                }
                                me.state.debounceTimers[col.field] = setTimeout(() => {
                                    delete me.state.debounceTimers[col.field];
                                    // trigger render again no matter what changed. 
                                    //me.setState({somethingChanged: me.state.somethingChanged++});        
                                    if (!value) return;
                                    let valArray = value.split(',').map(v => v.trim());
                                    let editorParams = { 
                                        ...columnDef.editorParams,
                                        values: valArray,
                                        showListOnEmpty: true,
                                        allowEmpty: true
                                    }
                                    console.log("EditorParams: ", editorParams);
                                    me.ref.table.updateColumnDefinition(col.field, {editorParams});
        
                                }, 1000)
                        }} />
                        <Form.Check type="checkbox" label="&nbsp; autocomplete multi" checked={checked} onChange={(event) => {
                            let checked = event.target.checked;
                            let curEditorParams = columnDef.editorParams || {}
                            let editorParams = { 
                                ...curEditorParams,
                                multiselect: checked
                            }
                            // trigger render again no matter what changed. 
                            me.setState({somethingChanged: me.state.somethingChanged++});
                            me.ref.table.updateColumnDefinition(col.field, {editorParams});
                        }}/>
                        <Form.Check type="checkbox" label="&nbsp; autocomplete cond-values" checked={condValues} onChange={(event) => {
                            let checked = event.target.checked;
                            let curEditorParams = columnDef.editorParams || {}
                            let editorParams = { 
                                ...curEditorParams,
                                conditionalValues: checked
                            }
                            // trigger render again no matter what changed. 
                            me.setState({somethingChanged: me.state.somethingChanged++});
                            me.ref.table.updateColumnDefinition(col.field, {editorParams});
                        }}/>
                        { condValues && 
                            <Form.Control as="textarea" rows="3" defaultValue={condExprStr} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers[col.field]) {
                                    clearTimeout(me.state.debounceTimers[col.field]);
                                }
                                me.state.debounceTimers[col.field] = setTimeout(() => {
                                    delete me.state.debounceTimers[col.field];
                                    // trigger render again no matter what changed. 
                                    //me.setState({somethingChanged: me.state.somethingChanged++});        
                                    if (!value) return;
                                    let condExprs = value.split('\n').map(v => v.trim());
                                    condExprs = condExprs.filter(v=> v !== "");
                                    let editorParams = { 
                                        ...columnDef.editorParams,
                                        conditionalExprs: condExprs,
                                        showListOnEmpty: true,
                                        allowEmpty: true
                                    }
                                    me.ref.table.updateColumnDefinition(col.field, {editorParams});
                                }, 1000)
                            }} />
                        }
                      </div>
            }
        } catch (e) {}
        return epc;
    }


    step1 () {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let s1 = [];
        let editorOptions = [];
        ['line', 'paragraph', 'codemirror', 'autocomplete', 'date'].map((v) => {
            let row = {};
            row.value = v;
            row.label = v;
            editorOptions.push(row);
        })
        let filterOptions = [];
        ['number', 'text'].map((v) => {
            let row = {};
            row.value = v;
            row.label = v;
            filterOptions.push(row);
        })
        let hozAlignOptions = [];
        ['left', 'center', 'right'].map((v)=> {
            let row = {};
            row.value = v;
            row.label = v;
            hozAlignOptions.push(row);
        })
        let vertAlignOptions = [];
        ['top', 'middle', 'bottom'].map((v)=> {
            let row = {};
            row.value = v;
            row.label = v;
            vertAlignOptions.push(row);
        })

        // try-catch for invalid access to columnAttrs if it is not loaded yet. 
        try {
            let me = this;
            let label = 
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                        <b>Column Attributes: </b>
                    </Col>
                </Row>
            s1.push(label); s1.push(<br/>);
            for (let i = 0; i < dsHome.dsViews[dsView].columnAttrs.length; i++) {
                let col = dsHome.dsViews[dsView].columnAttrs[i];
                let editorCurVal = {};
                if (col.editor === "textarea") {
                    editorCurVal = editorOptions[1];
                } else if (col.editor === "input") {
                    editorCurVal = editorOptions[0];
                } else if (col.editor === "autocomplete") {
                    editorCurVal = editorOptions[3];
                } else if (col.editor === "codemirror") {
                    editorCurVal = editorOptions[2];
                } else if (col.editor === "date") {
                    editorCurVal = editorOptions[4];
                }
                let hdrFilterTypeCurVal = {};
                if (col.headerFilterType === "input") {
                    hdrFilterTypeCurVal = filterOptions[1];
                } else if (col.headerFilterType === "number") {
                    hdrFilterTypeCurVal = filterOptions[0];
                } else {
                    ;
                }
                let hozAlignCurVal = {};
                if (col.hozAlign === 'left') {
                    hozAlignCurVal = hozAlignOptions[0]
                } else if (col.hozAlign === 'center') {
                    hozAlignCurVal = hozAlignOptions[1]
                } else if (col.hozAlign === 'right') {
                    hozAlignCurVal = hozAlignOptions[2]
                }
                let vertAlignCurVal = {};
                if (col.vertAlign === 'top') {
                    vertAlignCurVal = vertAlignOptions[0]
                } else if (col.vertAlign === 'middle') {
                    vertAlignCurVal = vertAlignOptions[1]
                } else if (col.vertAlign === 'bottom') {
                    vertAlignCurVal = vertAlignOptions[2]
                }
                let conditionalFormatting = false, condFormatExprStr = "";
                // XXX: This function should be using columnDef everywhere and not just col!
                let columnDef = this.ref.table.getColumn(col.field).getDefinition();
                try {
                    conditionalFormatting = columnDef.formatterParams.conditionalFormatting;
                } catch (e) {}
                try {
                    condFormatExprStr = columnDef.formatterParams.conditionalExprs.join('\n');
                } catch (e) {}

                s1.push(<Row style={{'border': '1px solid black', 'borderRadius': '5px', 'padding': '10px'}}>
                    <Col md={2} sm={2} xs={2}> 
                    <b>{col.field}</b>
                    </Col>
                    <Col md={2} sm={2} xs={2}>
                        Hoz-Align:
                        <Select className="basic-single" classNamePrefix="select" isClearable={true} name="hozAlignOptions" options={hozAlignOptions} defaultValue={hozAlignCurVal} onChange={(value) => { 
                                console.log("Setting for: ", col.field, value);
                                let column = me.ref.table.getColumn(col.field);
                                me.setHozAlign("", column, value.value)
                            }}
                        />
                        Vert-Align:
                        <Select className="basic-single" classNamePrefix="select" isClearable={true} name="vertAlignOptions" options={vertAlignOptions} defaultValue={vertAlignCurVal} onChange={(value) => { 
                                console.log("Setting for: ", col.field, value);
                                let column = me.ref.table.getColumn(col.field);
                                me.setVertAlign("", column, value.value)
                            }}
                        />
                    </Col>
                    <Col md={4} sm={4} xs={4}>
                        Editor: 
                        <Select className="basic-single" classNamePrefix="select" isClearable={true} name="editorOptions" options={editorOptions} defaultValue={editorCurVal} onChange={(value) => { 
                                console.log("Setting for: ", col.field);
                                let column = me.ref.table.getColumn(col.field);
                                if (value.value === "paragraph")
                                    me.setEditorToTextArea("", column);
                                else if (value.value === "codemirror")
                                    me.setEditorToCodeMirror("", column);
                                else if (value.value === "line")
                                    me.setEditorToInput("", column);
                                else if (value.value === "autocomplete")
                                    me.setEditorToAutocomplete("", column);
                                else if (value.value === "date")
                                    me.setEditorToDate("", column);

                                // trigger render again
                                me.setState({somethingChanged: me.state.somethingChanged++});
                            }}
                        />
                        {this.editorParamsControl(col)}
                        Hdr-filter-type: 
                        <Select className="basic-single" classNamePrefix="select" isClearable={true} name="filterOptions" options={filterOptions} defaultValue={hdrFilterTypeCurVal} onChange={(value) => { 
                                console.log("Setting for: ", col.field, value);

                                let column = me.ref.table.getColumn(col.field);
                                if (value.value === "number")
                                    me.setHdrFilterTypeToNumber("", column);
                                else if (value.value === "text") 
                                    me.setHdrFilterTypeToText("", column);
                            }}
                        />
                        <Form.Check type="checkbox" label="&nbsp; conditional formatting" checked={conditionalFormatting} onChange={(event) => {
                            let checked = event.target.checked;
                            let curFormatterParams = columnDef.formatterParams || {}
                            let formatterParams = { 
                                ...curFormatterParams,
                                conditionalFormatting: checked
                            }
                            // trigger render again no matter what changed. 
                            me.setState({somethingChanged: me.state.somethingChanged++});
                            me.ref.table.updateColumnDefinition(col.field, { formatterParams });
                        }}/>
                        { conditionalFormatting && 
                            <Form.Control as="textarea" rows="3" defaultValue={condFormatExprStr} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers[col.field]) {
                                    clearTimeout(me.state.debounceTimers[col.field]);
                                }
                                me.state.debounceTimers[col.field] = setTimeout(() => {
                                    delete me.state.debounceTimers[col.field];
                                    // trigger render again no matter what changed. 
                                    //me.setState({somethingChanged: me.state.somethingChanged++});        
                                    if (!value) return;
                                    let curFormatterParams = columnDef.formatterParams || {}
                                    let condExprs = value.split('\n').map(v => v.trim());
                                    condExprs = condExprs.filter(v=> v !== "");
                                    let formatterParams = { 
                                        ...curFormatterParams,
                                        conditionalExprs: condExprs,
                                    }
                                    me.setState({somethingChanged: me.state.somethingChanged++});
                                    me.ref.table.updateColumnDefinition(col.field, { formatterParams });
                                }, 1000)
                            }} />
                        }



                    </Col>
                </Row>);
                s1.push(<br/>);
            }
        } catch (e) {}

        return <div>{s1}</div>;
    }

    step2 () {
        const { match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let headerMenuWithoutHide = [
            {
                label:"Toggle Filters",
                action: this.toggleSingleFilter
            },
            {
                label:"Set Editor to 'line'",
                action: this.setEditorToInput
            },
            {
                label:"Set Editor to 'paragraph'",
                action: this.setEditorToTextArea
            },
            {
                label:"Disable editing",
                action: this.setEditorToFalse
            },
            {
                label:"Set Formatter to 'line'",
                action: this.setFormatterToPlainText
            },
            {
                label:"Set Formatter to 'paragraph'",
                action: this.setFormatterToTextArea
            },
            {
                label:"Set header filter type to number",
                action: this.setHdrFilterTypeToNumber
            },
            {
                label:"Set header filter type to text",
                action: this.setHdrFilterTypeToText
            },
            {
                label:"Plus 50 to column width",
                action: this.plusFiftyToWidth
            },
        ];
        let headerMenuWithHide = [
            {
                label:"Toggle Filters",
                action: this.toggleSingleFilter
            },
            {
                label:"Set Editor to 'line'",
                action: this.setEditorToInput
            },
            {
                label:"Set Editor to 'paragraph'",
                action: this.setEditorToTextArea
            },
            {
                label:"Disable editing",
                action: this.setEditorToFalse
            },
            {
                label:"Set Formatter to 'line'",
                action: this.setFormatterToPlainText
            },
            {
                label:"Set Formatter to 'paragraph'",
                action: this.setFormatterToTextArea
            },
            {
                label:"<i class='fas fa-eye-slash'></i> Hide Column",
                action: this.hideColumn
            },            
            {
                label:"Set header filter type to number",
                action: this.setHdrFilterTypeToNumber
            },
            {
                label:"Set header filter type to text",
                action: this.setHdrFilterTypeToText
            },
            {
                label:"Plus 50 to column width",
                action: this.plusFiftyToWidth
            },
        ];
        let s2 = '';

        if (dsHome && dsHome.dsViews && dsHome.dsViews[dsView] && dsHome.dsViews[dsView].columns) {
            let columns = [];
            for (let i = 0; i < dsHome.dsViews[dsView].columnAttrs.length; i++) {
                let col = JSON.parse(JSON.stringify(dsHome.dsViews[dsView].columnAttrs[i]));
                if (!this.isKey(col.field)) {
                    col.headerMenu = headerMenuWithHide;
                } else {
                    col.headerMenu = headerMenuWithoutHide;
                }
                if (!this.editors[col.field])
                    this.editors[col.field] = col.editor;
                if (col.editor === "codemirror" || col.editor === "date") col.editor = "textarea";
                col.editable = () => { return false };
                columns.push(col);
            }
            s2 = <Row>
                        <div>
                            <MyTabulator
                                columns={columns}
                                data={[]}
                                options={{
                                    ajaxURL: `${config.apiUrl}/ds/view/${this.props.match.params.dsName}/${dsView}/${user.user}`,
                                    ajaxConfig: {
                                        headers: {
                                            ...authHeader(),
                                            "Content-Type": "application/json",
                                        },
                                        credentials: 'include'
                                    },
                                    pagination:"remote",
                                    paginationDataSent: {
                                        page: 'page',
                                        size: 'per_page' // change 'size' param to 'per_page'
                                    },
                                    paginationDataReceived: {
                                        last_page: 'total_pages'
                                    },
                                    current_page: 1,
                                    paginationSize: 20,
                                    ajaxResponse: function (url, params, response) {
                                        console.log('ajaxResponse', url);
                                        return response; //return the response data to tabulator
                                    },
                                    ajaxError: function (error) {
                                        console.log('ajaxError', error);
                                    },
                                    movableColumns: true,
                                    cellEdited: this.cellEdited,
                                    index: "_id",
                                    ajaxSorting: true,
                                    ajaxFiltering: true,
                                    rowFormatter: (row) => {
                                        if(!row.getData()._id){
                                            row.getElement().style.backgroundColor = "lightGray";
                                        } else {
                                            row.getElement().style.backgroundColor = "white";
                                        }                               
                                    },
                                    renderComplete: this.renderComplete,
                                }}
                                innerref={this.recordRef}
                            />
                        </div>
                    </Row>            
        }
        return s2;
    }


    render () {
        const { match, dsHome } = this.props;
        let dsView = match.params.dsView;
        let dsName = match.params.dsName;

        document.title = `Edit-view: ${dsName}`;
        
        try {
            if (this.state.jiraProjectNameEnabled === null && dsHome.dsViews[dsView].jiraProjectName) {
                this.setState({
                    jiraProjectNameEnabled: true,
                    jiraProjectName: dsHome.dsViews[dsView].jiraProjectName
                });
            }
        } catch (e) { };
        try {
            if (this.state.jira === null && dsHome.dsViews[dsView].jiraConfig) {
                let jiraFieldMapping = this.state.jiraFieldMapping;
                for (let key in dsHome.dsViews[dsView].jiraConfig.jiraFieldMapping) {
                    jiraFieldMapping += `"${key}" -> "${dsHome.dsViews[dsView].jiraConfig.jiraFieldMapping[key]}"` + '\n';
                }
                this.setState({ jira: dsHome.dsViews[dsView].jiraConfig.jira, 
                                jql: dsHome.dsViews[dsView].jiraConfig.jql, 
                                jiraFieldMapping
                             });
            }
        } catch (e) {};
        try {
            if (this.state.jiraAgile === null && dsHome.dsViews[dsView].jiraAgileConfig) {
                let jiraAgileFieldMapping = this.state.jiraAgileFieldMapping;
                for (let key in dsHome.dsViews[dsView].jiraAgileConfig.jiraFieldMapping) {
                    jiraAgileFieldMapping += `"${key}" -> "${dsHome.dsViews[dsView].jiraAgileConfig.jiraFieldMapping[key]}"` + '\n';
                }
                this.setState({
                    jiraAgile: dsHome.dsViews[dsView].jiraAgileConfig.jira,
                    jiraAgileLabel: dsHome.dsViews[dsView].jiraAgileConfig.label,
                    jiraAgileBoardId: dsHome.dsViews[dsView].jiraAgileConfig.boardId,
                    jiraAgileFieldMapping: jiraAgileFieldMapping
                });
            }
        } catch (e) { };
        try {
            if (this.state.fixedHeight === null && dsHome.dsViews[dsView].otherTableAttrs) {
                this.setState({ fixedHeight: dsHome.dsViews[dsView].otherTableAttrs.fixedHeight, 
                             });
            }
        } catch (e) {};
        try {
            if (this.state.aclConfig === null && dsHome.dsViews[dsView].aclConfig) {
                let acl = "";
                if (typeof dsHome.dsViews[dsView].aclConfig.acl === "string") {
                    acl = dsHome.dsViews[dsView].aclConfig.acl;
                } else if (Array.isArray(dsHome.dsViews[dsView].aclConfig.acl)) {
                    for (let i = 0; i < dsHome.dsViews[dsView].aclConfig.acl.length; i++) {
                        acl += dsHome.dsViews[dsView].aclConfig.acl[i];
                        if (i < dsHome.dsViews[dsView].aclConfig.acl.length - 1) 
                            acl += ", ";
                    }
                }
                let aclConfig = { accessCtrl: dsHome.dsViews[dsView].aclConfig.accessCtrl, 
                    acl: acl
                 }
                this.setState({ aclConfig });
            }
        } catch (e) {};
        try {
            if (this.state.perRowAccessConfig === null && dsHome.dsViews[dsView].perRowAccessConfig) {
                let perRowAccessConfig = { enabled: dsHome.dsViews[dsView].perRowAccessConfig.enabled, 
                    column: dsHome.dsViews[dsView].perRowAccessConfig.column
                 }
                this.setState({ perRowAccessConfig });
            }
        } catch (e) {};

        let me = this;
        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                        <h3 style={{ 'float': 'center' }}>Dataset view: {match.params.dsName} | {match.params.dsView}</h3>
                    </Col>
                </Row>
                <br/>
                {this.dsDescription()}
                <br/>
                {this.step1()}
                <Row>
                    <Col md={2} sm={2} xs={2}>
                        <Form.Check inline type="checkbox" label="&nbsp;Add Jira project name" checked={this.state.jiraProjectNameEnabled} onChange={(event) => {
                            let checked = event.target.checked;
                            me.setState({ jiraProjectNameEnabled: checked });
                        }} />
                    </Col>
                    {this.state.jiraProjectNameEnabled &&
                        <Col md={6} sm={6} xs={6}>
                            <Form.Control type="text" defaultValue={this.state.jiraProjectName} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__dsViewEdit__main"]) {
                                    clearTimeout(me.state.debounceTimers["__dsViewEdit__main"]);
                                }
                                me.state.debounceTimers["__dsViewEdit__main"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__dsViewEdit__main"];
                                    if (!value) return;
                                    me.setState({ jiraProjectName: value });
                                }, 1000)
                            }} />
                        </Col>
                    }
                </Row>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <Form.Check inline type="checkbox" label="&nbsp;Add Jira query" checked={this.state.jira} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({jira: checked}); 
                                }}/>
                    </Col>
                    { this.state.jira && 
                        <Col md={6} sm={6} xs={6}> 
                        <Form.Control type="text" defaultValue={this.state.jql} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__dsViewEdit__main"]) {
                                    clearTimeout(me.state.debounceTimers["__dsViewEdit__main"]);
                                }
                                me.state.debounceTimers["__dsViewEdit__main"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__dsViewEdit__main"];
                                    if (!value) return;
                                    me.setState({jql: value});
                                }, 1000)
                            }} />
                        </Col> 
                    }
                </Row>
                <Row>
                    { this.state.jira && 
                        <Col md={2} sm={2} xs={2}> 
                            <b>Jira field mapping: </b>
                        </Col>
                    }
                    { this.state.jira && 
                        <Col md={6} sm={6} xs={6}> 
                        <Form.Control as="textarea" rows="3" defaultValue={this.state.jiraFieldMapping} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__dsViewEdit__main"]) {
                                    clearTimeout(me.state.debounceTimers["__dsViewEdit__main"]);
                                }
                                me.state.debounceTimers["__dsViewEdit__main"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__dsViewEdit__main"];
                                    // trigger render again no matter what changed. 
                                    //me.setState({somethingChanged: me.state.somethingChanged++});        
                                    if (!value) return;
                                    me.setState({jiraFieldMapping: value});
                                }, 1000)
                            }} />
                        </Col>
                    }
                </Row>
                <br />
                <br />
                <Row>
                    <Col md={2} sm={2} xs={2}>
                        <Form.Check inline type="checkbox" label="&nbsp;Add Jira Agile Label" checked={this.state.jiraAgile} onChange={(event) => {
                            let checked = event.target.checked;
                            me.setState({ jiraAgile: checked });
                        }} />
                    </Col>
                    {this.state.jiraAgile &&
                        <Col md={6} sm={6} xs={6}>
                            <Form.Control type="text" required defaultValue={this.state.jiraAgileLabel} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__dsViewEdit__main"]) {
                                    clearTimeout(me.state.debounceTimers["__dsViewEdit__main"]);
                                }
                                me.state.debounceTimers["__dsViewEdit__main"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__dsViewEdit__main"];
                                    if (!value) return;
                                    me.setState({ jiraAgileLabel: value });
                                }, 1000)
                            }} />
                        </Col>
                    }
                </Row>
                <Row>
                    {this.state.jiraAgile &&
                        <Col md={2} sm={2} xs={2}>
                            <b>Jira Agile BoardId: </b>
                        </Col>
                    }
                    {this.state.jiraAgile &&
                        <Col md={6} sm={6} xs={6}>
                            <Form.Control type="number" required defaultValue={this.state.jiraAgileBoardId} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__dsViewEdit__main"]) {
                                    clearTimeout(me.state.debounceTimers["__dsViewEdit__main"]);
                                }
                                me.state.debounceTimers["__dsViewEdit__main"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__dsViewEdit__main"];
                                    // trigger render again no matter what changed.
                                    //me.setState({somethingChanged: me.state.somethingChanged++});        
                                    if (!value) return;
                                    me.setState({ jiraAgileBoardId: value });
                                }, 1000)
                            }} />
                        </Col>
                    }
                </Row>
                <Row>
                    {this.state.jiraAgile &&
                        <Col md={2} sm={2} xs={2}>
                            <b>Jira Agile field mapping: </b>
                        </Col>
                    }
                    {this.state.jiraAgile &&
                        <Col md={6} sm={6} xs={6}>
                            <Form.Control as="textarea" rows="3" defaultValue={this.state.jiraAgileFieldMapping} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__dsViewEdit__main"]) {
                                    clearTimeout(me.state.debounceTimers["__dsViewEdit__main"]);
                                }
                                me.state.debounceTimers["__dsViewEdit__main"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__dsViewEdit__main"];
                                    // trigger render again no matter what changed. 
                                    //me.setState({somethingChanged: me.state.somethingChanged++});        
                                    if (!value) return;
                                    me.setState({ jiraAgileFieldMapping: value });
                                }, 1000)
                            }} />
                        </Col>
                    }
                </Row>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <Form.Check inline type="checkbox" label="&nbsp;Fixed height" checked={this.state.fixedHeight} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({fixedHeight: checked}); 
                                }}/>
                    </Col>
                </Row>
                <AccessCtrl dsName={dsName} dsView={dsView} onChange={(value) => {
                    console.log(`Received access control as:`, value);
                    me.setState({aclConfig: value});
                }}>
                </AccessCtrl>
                <PerRowAccessCtrl config={this.state.perRowAccessConfig} onChange={(cfg) => {
                    me.setState({perRowAccessConfig: cfg});
                }}/>
                <br/>
                <Row>
                    <Button onClick={this.pushColumnDefs}> Set View </Button>
                    <Button onClick={this.showAllCols}> Show all columns </Button>
                    {/*
                    <Button onClick={this.addCol}> Add Column </Button>
                     */}
                    {this.setViewStatus()}
                </Row>
                {this.step2()}
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

const cDsViewEdit = connect(mapStateToProps)(DsViewEdit);


export default cDsViewEdit