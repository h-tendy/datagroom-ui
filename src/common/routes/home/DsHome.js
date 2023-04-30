import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap'
import { connect } from 'react-redux';
import Select from 'react-select';
import 'react-tabulator/lib/styles.css'; // required styles
import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator } from 'react-tabulator';
import { authHeader } from '../../helpers';

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}

class DsHome extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: null,
            range: "",
            dsName: ""
        };
    }

    step1 () {
        const { newDs, dsHome } = this.props;

        if ( !Object.keys(dsHome).length ) {
            // Here, fetch all the views available for the dataset. 
            // dispatch(newDsActions.loadHdrsFromRange(newDs.fileName, newDs.selectedSheet, this.state.range));
        }

        let s1 = '';
        if (newDs && newDs.loadStatus && newDs.loadStatus.loadStatus && newDs.loadStatus.hdrs && Object.keys(newDs.loadStatus.hdrs).length) {
            let hdrOptions = [];
            Object.entries(newDs.loadStatus.hdrs).map((kv) => {
                let row = {};
                row.value = kv[1];
                row.label = kv[1];
                hdrOptions.push(row);
            });
            s1 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 4.</b> Select key(s):
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Select className="basic-multi-select" classNamePrefix="select" isClearable={true} name="sheetOptions" options={hdrOptions} onChange={this.keySelectorOnChange} isMulti/>
                    </Col>
                 </Row>
        }
        return s1;
    }
    
    render () {
        var columns = [
            { title: 'Issue Id', field: 'IssueID', width: 150 },
            { title: 'Cur Owner', field: 'CurrentOwner', width: 150 },
            { title: 'Title', field: 'Title', width: 800, formatter: "textarea", variableHeight: true },
        ];        
        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <h3 style={{ 'float': 'center' }}><label className="underline">Browse Datasets</label></h3>
                    </Col>
                </Row>
                <Row>
                        <div>
                            Hi, will load: {this.props.match.params.dsName}
                            <ReactTabulator
                                columns={columns}
                                data={[]}
                                options={{
                                    ajaxURL: `${config.apiUrl}/ds/view/${this.props.match.params.dsName}`,
                                    ajaxConfig: {
                                        headers: {
                                            ...authHeader(),
                                            "Content-Type": "application/json",
                                        },
                                        credentials: 'include'
                                    },
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
                                    paginationSize: 30,
                                    ajaxResponse: function (url, params, response) {
                                        console.log('ajaxResponse', url);
                                        return response; //return the response data to tabulator
                                    },
                                    ajaxError: function (error) {
                                        console.log('ajaxError', error);
                                    }
                    
                                }}
                            />
                        </div>
                </Row>            
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

const cDsHome = connect(mapStateToProps)(DsHome);


export default cDsHome