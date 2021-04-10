import React, { Component } from 'react'
import { Row, Col, Button, Form } from 'react-bootstrap'
import { connect } from 'react-redux';
import { dsActions } from '../../actions/ds.actions';
import { dsConstants } from '../../constants';
import MyTabulator from './MyTabulator';
import MyTextArea from './MyTextArea';
import 'highlight.js/styles/solarized-light.css'
import MyAutoCompleter from './MyAutoCompleter';
import MySingleAutoCompleter from './MySingleAutoCompleter';

import './simpleStyles.css';
let MarkdownIt = new require('markdown-it')({
    linkify: true,
    html: true
}).use(require('markdown-it-bracketed-spans')).use(require('markdown-it-attrs')).use(require('markdown-it-container'), 'code').use(require('markdown-it-highlightjs'));


const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}

class DsEditLog extends Component {
    constructor(props) {
        super(props)
        this.state = {
            firstTime: true,
            filterButtonText: 'Enable Filters',
            editingButtonText: 'Disable Editing',
            pageSize: 30,
            totalRecs: 0, 

            singleClickEdit: false,
            showAllFilters: false,
            disableEditing: false,
        };
        this.ref = null;
        
        this.lockedByOthersCells = {};
        this.firstRenderCompleted = false;
        this.cellImEditing = null;

        this.renderComplete = this.renderComplete.bind(this);
        this.cellEditCheck = this.cellEditCheck.bind(this);

        this.recordRef = this.recordRef.bind(this);
        this.downloadXlsx = this.downloadXlsx.bind(this);
        this.toggleFilters = this.toggleFilters.bind(this);
        this.toggleSingleFilter = this.toggleSingleFilter.bind(this);
        this.ajaxResponse = this.ajaxResponse.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);

        let singleClickEditFrmLocal = localStorage.getItem("singleClickEdit");
        singleClickEditFrmLocal = JSON.parse(singleClickEditFrmLocal);
        this.state.singleClickEdit = singleClickEditFrmLocal;
    }
    componentDidMount () {
        const { dispatch, match, user, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
    }
    componentWillUnmount () {
        const { dispatch } = this.props;
    }

    renderComplete () {
        const { match } = this.props;
        let dsName = match.params.dsName; 
    }

    cellEditCheck (cell) {      
        return false;
    }


    toggleFilters () {
        const { dsHome, match } = this.props;
        //let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

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

    copyToClipboard () {
        // You have to also set 'clipboard' to true in table options.
        this.ref.table.copyToClipboard();
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

    setColumnDefinitions () {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;

        let headerMenu = [
            {
                label:"Toggle Filters",
                action: this.toggleSingleFilter
            }
        ];
        let columns = [];
        let columnAttrs = [
            {field: 'opr', title: 'opr', width: 100, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
            {field: 'status', title: 'status', width: 100, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
            {field: 'user', title: 'user', width: 150, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
            {field: 'date', title: 'date', width: 150, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
            {field: 'column', title: 'column', width: 150, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
            {field: 'selector', title: 'selector', width: 200, formatter: "textarea", headerTooltip: true}, 
            {field: 'oldVal', title: 'oldVal', width: 200, formatter: "textarea", headerTooltip: true}, 
            {field: 'newVal', title: 'newVal', width: 200, formatter: "textarea", headerTooltip: true}, 
            {field: 'doc', title: 'doc', width: 300, formatter: "textarea", headerTooltip: true}, 
        ];
        for (let i = 0; i < columnAttrs.length; i++) {
            let col = JSON.parse(JSON.stringify(columnAttrs[i]));
            col.headerMenu = headerMenu;
            col.editable = this.cellEditCheck;

            
            if (col.field === "selector" || col.field === "doc") {
                col.formatter = (cell, formatterParams) => {
                    let value = cell.getValue();
                    var newLine = String.fromCharCode(13, 10);                
                    if (value) {
                        value = value.replace(/\\\\n/g, '__dg__newline');
                        value = value.replace(/\\n/g, newLine);
                        value = value.replace(/__dg__newline/g, '\\n');                    
                        //return `<pre>${value}</pre>`;
                        return `<div style="white-space:pre-wrap;word-wrap:break-word;">${value}</div>`;
                    }
                    return '';
                }
            }

            if (col.editor === "textarea" || (col.editor === false && col.formatter === "textarea") || (col.editor === "autocomplete")) {
                // By default, all textareas support markdown now. 
                col.formatter = (cell, formatterParams) => {
                    let value = cell.getValue();
                    if (typeof value != "string") return value;
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;margin-bottom:-12px">${value}</div>`;
                }
                col.variableHeight = true;
                if (col.editor === "textarea") {
                    // Set the editor to a fixed one for special keys. 
                    col.editor = MyTextArea;
                    col.cellEditCancelled = (cell) => {
                        cell.getRow().normalizeHeight();
                    }
                }
            }
            columns.push(col);
        }
        return columns;
    }

    ajaxResponse (url, params, response) {
        console.log('ajaxResponse: ', response);
        this.setState({ totalRecs: response.total});
        return response; 
    }

    step2 () {
        const { match, dsHome } = this.props;
        let dsName = match.params.dsName; 
        let dsView = match.params.dsView;
        let s2 = '';

        let columns = this.setColumnDefinitions();
        console.log("Columns: ", columns);
        s2 = <Row>
                    <div>
                        <MyTabulator
                            columns={columns}
                            data={[]}
                            options={{
                                ajaxURL: `${config.apiUrl}/ds/view/editLog/${this.props.match.params.dsName}`,
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
                                index: "_id",
                                ajaxSorting: true,
                                ajaxFiltering: true,
                                //height: "500px",
                                //virtualDomBuffer: 500,
                                clipboard: true,
                                rowFormatter: (row) => {
                                    if(!row.getData()._id){
                                        row.getElement().style.backgroundColor = "lightGray";
                                    } else {
                                        row.getElement().style.backgroundColor = "white";
                                    }  
                                },
                                cellMouseEnter: (e, cell) => {
                                    if (cell.getElement().style.backgroundColor !== "lightblue") 
                                        cell.__dg__prevBgColor = cell.getElement().style.backgroundColor;
                                    cell.getElement().style.backgroundColor = "lightblue";
                                },
                                cellMouseLeave: (e, cell) => {
                                    cell.getElement().style.backgroundColor = cell.__dg__prevBgColor;
                                    delete cell.__dg__prevBgColor;
                                },
                                renderComplete: this.renderComplete
                            }}
                            innerref={this.recordRef}
                            />
                    </div>
                </Row>            
        return s2;
    }


    render () {
        const { match } = this.props;
        let me = this;

        document.title = `Edit-log: ${match.params.dsName}`;

        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                        <h3 style={{ 'float': 'center' }}><label className="underline">Editlog view: {match.params.dsName}</label></h3>
                    </Col>
                </Row>
                <br/>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <Form inline>
                    <Form.Check inline type="checkbox" label="&nbsp;Show all filters" checked={this.state.showAllFilters} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({showAllFilters: checked});
                                    localStorage.setItem("showAllFilters", JSON.stringify(checked));
                                    me.toggleFilters();
                                }}/>
                    </Form>
                    </Col>
                </Row>
                {/*
                <Row>
                    <Button onClick={this.copyToClipboard}> Copy-to-clipbard </Button>
                </Row>  */}
                <Row>
                <Col md={4} sm={4} xs={4}> 
                    <b>Total records: {this.state.totalRecs}</b>
                </Col>
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

const cDsEditLog = connect(mapStateToProps)(DsEditLog);


export default cDsEditLog