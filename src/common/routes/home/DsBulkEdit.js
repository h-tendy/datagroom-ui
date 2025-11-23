import React, { Component } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { dsConstants } from '../../constants';
import { dsActions } from '../../actions/ds.actions';
import Select from 'react-select';

class DsBulkEdit extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: null,
            formData: null,
            range: "",
            dsName: "",
            setColsFrmSheet: false,
            setRowsFrmSheet: false,
            validate: false,
            doIt: false
        };
        this.downloadXlsx = this.downloadXlsx.bind(this);
        this.onFileSelect = this.onFileSelect.bind(this);
        this.sheetSelectorOnChange = this.sheetSelectorOnChange.bind(this);
        this.rangeOnChange = this.rangeOnChange.bind(this);
        this.rangeSelectionDone = this.rangeSelectionDone.bind(this);
    }

    downloadXlsx () {
        const { dispatch, match, user } = this.props;
        let dsName = match.params.dsName; 
        let dsView = "default";

        dispatch(dsActions.downloadXlsx(dsName, dsView, user.user));
    }

    onFileSelect(event) {
        const { dispatch, user } = this.props;
        this.setState({file: event.target.files[0]});
        let file = event.target.files[0];
        if ( file ) {
            let remoteFileName = user.user + '_' + file.name;
            // Create an object of formData 
            const formData = new FormData(); 
            // Update the formData object 
            formData.append( 
                "file", 
                file,
                remoteFileName
            );     
            this.setState({ file, formData });
            dispatch(dsActions.uploadBulkEditXlsFile(remoteFileName, formData));
        }
    }

    componentDidMount () {
        const { dispatch } = this.props;
        dispatch(dsActions.clearBulkEditStore());
    }

    componentWillUnmount () {
    }

    step1Status () {
        const { dsHome } = this.props;
        let s1Status = '';

        if (dsHome && dsHome.dsBulkEdits && dsHome.dsBulkEdits.uploadStatus === 'fail') {
            s1Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                    <b style={{color: 'red'}}>{dsHome.uploadError}</b>
                                </Col>
                        </Row>
        }
        if (dsHome && dsHome.dsBulkEdits && dsHome.dsBulkEdits.uploadStatus === 'success' && !dsHome.dsBulkEdits.sheetInfo.length) {
            s1Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                <b style={{color: 'red'}}>Failed to recognize the sheets!</b>
                                </Col>
                        </Row>
        }
        return s1Status;
    }
    sheetSelectorOnChange (value) {
        const { dispatch } = this.props;
        console.log(value);
        dispatch(dsActions.setSelectedSheet(value ? value.value : null));
        // Drop the result on the floor if you are no longer the selected value. 
        // This is required for race-conditions when the user rapidly changes the
        // selection. 
        // Or add a button to do the actual network call. 
    }

    step2 () {
        const { dsHome } = this.props;
        let s2 = '';
        if (dsHome && dsHome.dsBulkEdits && dsHome.dsBulkEdits.uploadStatus === 'success' && dsHome.dsBulkEdits.sheetInfo.length) {
            let sheetOptions = [];
            dsHome.dsBulkEdits.sheetInfo.map((v) => {
                let row = {};
                row.value = v;
                row.label = v;
                sheetOptions.push(row);
            });
            s2 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 2.</b> Select sheet:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Select className="basic-single" classNamePrefix="select" isClearable={true} name="sheetOptions" options={sheetOptions} onChange={this.sheetSelectorOnChange}/>
                    </Col>
                 </Row>
        }
        return s2;
    }

    rangeOnChange (event) {
        this.setState({ range: event.target.value });
    }
    rangeSelectionDone (e, doIt = false) {
        const { dsHome, dispatch, match, user } = this.props;
        let dsName = match.params.dsName;
        let dsUser = user.user;
        if (doIt) {
            this.setState({ doIt: true });
        } else {
            this.setState({ validate: true, doIt: false });
            dispatch({ type: dsConstants.CLEAR_LOADSTATUS });
        }
        dispatch(dsActions.doBulkEditRequest(dsName, dsHome.dsBulkEdits.fileName, dsHome.dsBulkEdits.selectedSheet, this.state.range, this.state.setRowsFrmSheet, this.state.setColsFrmSheet, doIt, dsUser));
    }

    step3 () {
        const { dsHome } = this.props;
        let s3 = ''; let me = this;
        if (dsHome && dsHome.dsBulkEdits && dsHome.dsBulkEdits.selectedSheet && dsHome.dsBulkEdits.selectedSheet.length) {
            s3 = <div>
                 <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 3.</b> Specify range (must include hdrs):
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form.Control type="text" value={this.state.range} onChange={this.rangeOnChange} />
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Button onClick={this.rangeSelectionDone}> Validate! </Button> 
                    </Col>
                 </Row>
                 <Row>
                    <Col md={2} sm={2} xs={2}> 
                    </Col>
                    <Col md={6} sm={6} xs={6}> 
                    <Form.Check type="checkbox" label="&nbsp;" checked={this.state.setRowsFrmSheet} onChange={(event) => {
                            let checked = event.target.checked;
                            me.setState({setRowsFrmSheet: checked})
                        }}/>
                    <b>Set data rows</b> as in specified range of the sheet (deletes all other rows). Uncheck this if you don't want to delete other rows in the db that is not specified in your sheet range.
                    </Col>
                 </Row>
                 <Row>
                    <Col md={2} sm={2} xs={2}> 
                    </Col>
                    <Col md={6} sm={6} xs={6}> 
                    <Form.Check type="checkbox" label="&nbsp;" checked={this.state.setColsFrmSheet} onChange={(event) => {
                            let checked = event.target.checked;
                            me.setState({setColsFrmSheet: checked})
                        }}/>
                    <b>Set data columns</b> as in specified range of the sheet (deletes all other columns). Uncheck this if you want to only bulk-edit the columns specified in your sheet range. All other column attributes will be untouched.
                    </Col>
                 </Row>
                 </div>
        }
        return s3;
    }

    step3Status () {
        const { dsHome /*, match */ } = this.props;
        // let dsName = match.params.dsName;
        let s3Status = '';
        let errorJsx, success = false;
        try {
            if (dsHome.dsBulkEdits.loadStatus.loadStatus) {
                success = true;
            }
        } catch (e) {}
        try {
            if (!dsHome.dsBulkEdits.loadStatus.loadStatus) {
                if (Object.keys(dsHome.dsBulkEdits.loadStatus.hdrErrors).length) {
                    errorJsx = Object.entries(dsHome.dsBulkEdits.loadStatus.hdrErrors).map ((kv) => {
                        return <div>[ {kv[0]} ] : [ <b style={{color: 'red'}}> {kv[1]} </b> ] </div>
                    })
                } else {
                    errorJsx = <b style={{color: 'red'}}> {dsHome.dsBulkEdits.loadStatus.error} </b>;
                }
            }
        } catch (e) {}
        if (errorJsx) {
            s3Status = <Row>
                            <Col md={12} sm={12} xs={12}> 
                            <b>Error: </b>{errorJsx}
                            </Col>                        
                       </Row>
        } else if (success) {
            /*
            let url = `/ds/${dsName}/default`;
            s3Status = <Row>
                            <br/><br/>
                            <Col md={6} sm={6} xs={6}> 
                                <b style={{color: 'green'}}>Successfully updated: </b>
                                <Link to={url}>Click here for your dataset</Link>
                            </Col>
                       </Row> */
        }
        return s3Status;
    }

    renderOprLog () {
        const { dsHome } = this.props;
        let s = "";
        try {
            let oprLog = dsHome.dsBulkEdits.loadStatus.oprLog;
            s = <div><ol>
                {
                    oprLog.map(log => (<li>{log}</li>))
                }
            </ol></div>
        } catch (e) {} 
        return s;
    }
    step4 () {
        const { dsHome } = this.props;
        let s4 = '';
        if (this.state.validate && dsHome && dsHome.dsBulkEdits && dsHome.dsBulkEdits.loadStatus && dsHome.dsBulkEdits.loadStatus.loadStatus) {
            s4 = <Row>
                <Col md={2} sm={2} xs={2}> 
                </Col>
                <Col md={4} sm={4} xs={4}>
                    <b>Will perform the following operations:</b><br/>
                    {this.renderOprLog()}
                </Col>
                <Col md={4} sm={4} xs={4}> 
                <Button onClick={() => {this.rangeSelectionDone(null, true)}}> Do It! </Button> 
                </Col>
            </Row>
        }
        return s4;
    }

    step4Status () {
        const { dsHome, match } = this.props;
        let dsName = match.params.dsName;
        let s4Status = '';
        let errorJsx, success = false;
        try {
            if (this.state.doIt && dsHome.dsBulkEdits.loadStatus.loadStatus) {
                success = true;
            }
        } catch (e) {}
        try {
            if (this.state.doIt && !dsHome.dsBulkEdits.loadStatus.loadStatus) {
                if (Object.keys(dsHome.dsBulkEdits.loadStatus.hdrErrors).length) {
                    errorJsx = Object.entries(dsHome.dsBulkEdits.loadStatus.hdrErrors).map ((kv) => {
                        return <div>[ {kv[0]} ] : [ <b style={{color: 'red'}}> {kv[1]} </b> ] </div>
                    })
                } else {
                    errorJsx = <b style={{color: 'red'}}> {dsHome.dsBulkEdits.loadStatus.error} </b>;
                }
            }
        } catch (e) {}
        if (errorJsx) {
            s4Status = <Row>
                            <Col md={12} sm={12} xs={12}> 
                            <b>Error: </b>{errorJsx}
                            </Col>                        
                       </Row>
        } else if (success) {
            let url = `/ds/${dsName}/default`;
            s4Status = <Row>
                            <br/><br/>
                            <Col md={6} sm={6} xs={6}> 
                                <b style={{color: 'green'}}>Successfully updated: </b>
                                <Link to={url}>Click here for your dataset</Link>
                            </Col>
                       </Row>
        }
        return s4Status;
    }


    render () {
        const { match } = this.props;
        let dsName = match.params.dsName;
        document.title = `Bulk-edit: ${dsName}`;

        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <h3 style={{ 'float': 'center' }}><label className="underline">Bulk Edit for: {dsName}</label></h3>
                    It is <b>highly recommended</b> that you take an <button size="sm" className="btn btn-link" onClick={this.downloadXlsx}><b>xlsx backup</b> </button> before you attempt this. Also, good to warn your users not to make any edits while you are doing this! 
                    
                    </Col>
                </Row>
                <br/>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 1.</b> Select xls file:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form.Control type="file" name="file" onChange={this.onFileSelect} />
                    </Col>
                </Row>
                {this.step1Status()}
                <br/>
                {this.step2()}
                <br/>
                {this.step3()}
                {this.step3Status()}
                <br/>
                {this.step4()}
                {this.step4Status()}
            </div>
        );
    }

}

function mapStateToProps(state) {
    const { user } = state.authentication;
    const { home } = state;
    const { newDs } = state;
    const { dsHome } = state;
    return {
        user,
        home,
        newDs,
        dsHome
    }
}

const cDsBulkEdit = connect(mapStateToProps)(DsBulkEdit);


export default cDsBulkEdit