import React, { Component } from 'react'
import { Row, Col, Button, Form } from 'react-bootstrap'
import { connect } from 'react-redux';
import { dsActions } from '../../actions/ds.actions';
import { dsConstants } from '../../constants';
import MyTabulator from './MyTabulator';
import MyTextArea from './MyTextArea';
//import 'highlight.js/styles/solarized-light.css'
import { uploadService } from '../../services';
import Modal from './Modal';
import ReactDOM from 'react-dom';

import './simpleStyles.css';
import { authHeader } from '../../helpers';
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

class DsAttachments extends Component {
    constructor(props) {
        super(props)
        this.state = {
            filterButtonText: 'Enable Filters',
            pageSize: 30,
            totalRecs: 0,
            refresh: 0, 

            initialHeaderFilter: [],
            initialSort: [{column: "time", dir: "desc"}], 
            showModal: false,
            modalTitle: "Title of modal",
            modalQuestion: "This is the modal question",
            modalCallback: null,
            showAllFilters: false,
        };
        this.ref = null;

        this.renderComplete = this.renderComplete.bind(this);
        this.cellEditCheck = this.cellEditCheck.bind(this);

        this.recordRef = this.recordRef.bind(this);
        this.onFileSelect = this.onFileSelect.bind(this);
        this.toggleFilters = this.toggleFilters.bind(this);
        this.toggleSingleFilter = this.toggleSingleFilter.bind(this);
        this.ajaxResponse = this.ajaxResponse.bind(this);
        this.deleteRowHandler = this.deleteRowHandler.bind(this);
        this.deleteRowQuestion = this.deleteRowQuestion.bind(this);
        this.toggleModal = this.toggleModal.bind(this);

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
        setTimeout(() => 
        window.highlightJsBadge(), 1000);
    }

    cellEditCheck (cell) {      
        return false;
    }
    toggleModal (confirmed) {
        this.state.modalCallback(confirmed);
        this.setState({ showModal: !this.state.showModal });
    }

    async onFileSelect(event) {
        const { match } = this.props;
        let dsName = match.params.dsName;
        console.log("Files: ", event.target.files);
        // https://fb.me/react-event-pooling 
        event.persist();
        for (let i = 0; i < event.target.files.length; i++) {
            let file = event.target.files[i];
            if ( file ) {
                let remoteFileName = file.name.replaceAll(" ", "_");
                const formData = new FormData(); 
                formData.append( 
                    "file", 
                    file,
                    remoteFileName
                );
                formData.append("dsName", dsName);
                await uploadService.uploadAttachment(formData);
            }    
        }
        // Preserve filters
        let initialHeaderFilter = this.ref.table.getHeaderFilters();
        console.log("initialHeaderFilter: ", initialHeaderFilter);
        this.setState({ initialHeaderFilter });
        // Preserve sorters
        let hdrSortersTmp = this.ref.table.getSorters();
        let hdrSorters = [];
        for (let i = 0; i < hdrSortersTmp.length; i++) {
            let sorter = {};
            sorter.column = hdrSortersTmp[i].field;
            sorter.dir = hdrSortersTmp[i].dir;
            hdrSorters.push(sorter);
        }
        this.setState({ initialSort: hdrSorters });
        // showAllFilters & initialHeaderFilter is not working yet
        //this.setState({ showAllFilters: false });
        // Force refresh
        this.setState({ refresh: this.state.refresh + 1 });
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

    recordRef (ref) {
        // setting state is causing grief to the Tabulator component. 
        //this.setState({ ref });
        this.ref = ref;
        return true;
    }

    async deleteRowHandler (e, cell, confirmed) {
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
            await uploadService.deleteOneAttachment({ dsName, dsView, user: user.user, _id });
            cell.getRow().delete();
            this.setState({totalRecs: this.state.totalRecs - 1});
        }
    }

    deleteRowQuestion (e, cell) {
        let me = this;
        this.setState({ modalTitle: "Delete current attachment?", 
                        modalQuestion: `This will delete the attachment shown in this row. Please confirm. This cannot be undone. Pls ensure links to this attachment are also fixed!`,
                        modalCallback: (confirmed) => me.deleteRowHandler(e, cell, confirmed),
                        showModal: !this.state.showModal });
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
        let cellContextMenu = [
            {
                label:"Delete row...",
                action: this.deleteRowQuestion
            },
        ];
        let columns = [];
        let columnAttrs = [
            {field: '_id', title: 'file', width: 800, formatter: "textarea", headerTooltip: true, hozAlign: 'left', vertAlign: 'top'}, 
            {field: 'size', title: 'size', width: 100, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
            {field: 'time', title: 'time', width: 160, formatter: "textarea", headerTooltip: true, hozAlign: 'center', vertAlign: 'middle'}, 
        ];
        for (let i = 0; i < columnAttrs.length; i++) {
            let col = JSON.parse(JSON.stringify(columnAttrs[i]));
            col.headerMenu = headerMenu;
            col.contextMenu = cellContextMenu;
            col.editable = this.cellEditCheck;
            if (this.state.initialHeaderFilter.length) {
                col.headerFilter = "input";
            }
            if (col.field === '_id') {
                col.formatter = (cell, formatterParams) => {
                    let value = cell.getValue();
                    if (value === undefined) return "";
                    if (typeof value != "string") return value;

                    value = '/' + value;
                    let origValue = value;
                    value = `Click to view: [${value}](${value})`;
                    value += `\n\nTo use this image, copy the text below and paste into your cell!:\n`;
                    if (/(\.png$)|(\.jpg$)|(\.gif$)|(\.jpeg$)/i.test(origValue)) {
                        value += "\n\n``` md\n\n" + `<img src="${origValue}" alt="${origValue}" width="100%" height="100%" />` + `\n` + "```\n"; 
                        
                    } else {
                        value += "\n\n``` md\n\n" + `[Modify link text](${origValue})` + `\n` + "```\n"; 
                    }
                    value = MarkdownIt.render(value);
                    return `<div style="white-space:normal;word-wrap:break-word;margin-bottom:-12px;">${value}</div>`;
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
        const { match, user, dsHome } = this.props;
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
                                ajaxURL: `${config.apiUrl}/ds/view/attachments/${this.props.match.params.dsName}/${dsView}/${user.user}`,
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
                                initialHeaderFilter: this.state.initialHeaderFilter,
                                initialSort: JSON.parse(JSON.stringify(this.state.initialSort)),
                                paginationSize: this.state.pageSize,
                                paginationSizeSelector: [10, 25, 50, 100, 500, true],
                                ajaxResponse: this.ajaxResponse,
                                ajaxError: function (error) {
                                    console.log('ajaxError', error);
                                },
                                forceRefresh: this.state.refresh,
                                index: "_id",
                                ajaxSorting: true,
                                ajaxFiltering: true,
                                //height: "500px",
                                //virtualDomBuffer: 500,
                                clipboard: true,
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

        document.title = `Attachments: ${match.params.dsName}`;

        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                        <h3 style={{ 'float': 'center' }}><label className="underline">Attachments in: {match.params.dsName}</label></h3>
                    </Col>
                </Row>
                <br/>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Select files to upload: </b>
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form ref={ form => this.fileInputForm = form } onClick={() => ReactDOM.findDOMNode(this.fileInputForm).reset() }>
                        <Form.Control type="file" name="file" id="fileInput" multiple="multiple" onChange={this.onFileSelect} /> 
                    </Form>
                    </Col>
                </Row>
                <br/>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <Form inline>
                    <Form.Check inline type="checkbox" label="&nbsp;Show all filters" checked={this.state.showAllFilters} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({showAllFilters: checked, /*refresh: this.state.refresh + 1 */});
                                    localStorage.setItem("showAllFilters", JSON.stringify(checked));
                                    me.toggleFilters();
                                    //me.ref.table.setData();
                                }}/>
                    </Form>
                    </Col>
                </Row>
                <Row>
                <Col md={4} sm={4} xs={4}> 
                    <b>Total records: {this.state.totalRecs}</b>
                </Col>
                </Row>
                {this.step2()}
                <Modal show={this.state.showModal}
                    onClose={this.toggleModal} title={this.state.modalTitle}>
                    {this.state.modalQuestion}
                </Modal>
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

const cDsAttachments = connect(mapStateToProps)(DsAttachments);


export default cDsAttachments