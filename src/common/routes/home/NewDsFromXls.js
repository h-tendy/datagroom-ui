import React, { Component } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { newDsActions } from './NewDsStoreMgmt';
import Select from 'react-select';

class NewDsFromXls extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: null,
            formData: null,
            range: "",
            dsName: ""
        };
        this.onFileSelect = this.onFileSelect.bind(this);
        this.sheetSelectorOnChange = this.sheetSelectorOnChange.bind(this);
        this.sheetSelectionDone = this.sheetSelectionDone.bind(this);
        this.rangeOnChange = this.rangeOnChange.bind(this);
        this.rangeSelectionDone = this.rangeSelectionDone.bind(this);
        this.keySelectorOnChange = this.keySelectorOnChange.bind(this);
        this.dsNameOnChange = this.dsNameOnChange.bind(this);
        this.createDs = this.createDs.bind(this);
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
            dispatch(newDsActions.uploadXlsFile(remoteFileName, formData));
        }
    }

    componentDidMount () {
        const { dispatch } = this.props;
        dispatch(newDsActions.clearReduxStore());
    }

    componentDidUpdate (prevProps) {
        const { newDs } = this.props;
        const prevNewDs = prevProps.newDs;
        // Only update range if autoDetectedRange is NEW (wasn't there before) and different from current state
        // This prevents overwriting user's manual edits
        if (newDs && newDs.autoDetectedRange && 
            (!prevNewDs || !prevNewDs.autoDetectedRange || prevNewDs.autoDetectedRange !== newDs.autoDetectedRange) &&
            newDs.autoDetectedRange !== this.state.range) {
            this.setState({ range: newDs.autoDetectedRange });
        }
    }

    componentWillUnmount () {
    }

    step1Status () {
        const { newDs } = this.props;
        let s1Status = '';

        if (newDs && newDs.uploadStatus === 'fail') {
            s1Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                    <b style={{color: 'red'}}>{newDs.uploadError}</b>
                                </Col>
                        </Row>
        }
        if (newDs && newDs.uploadStatus === 'success' && !newDs.sheetInfo.length) {
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
        dispatch(newDsActions.setSelectedSheet(value ? value.value : null));
        // Drop the result on the floor if you are no longer the selected value. 
        // This is required for race-conditions when the user rapidly changes the
        // selection. 
        // Or add a button to do the actual network call. 
    }
    sheetSelectionDone () {
        const { newDs, dispatch } = this.props;
        dispatch(newDsActions.findHeadersInSheet(newDs.fileName, newDs.selectedSheet));
    }
    step2 () {
        const { newDs } = this.props;
        let s2 = '';
        if (newDs && newDs.uploadStatus === 'success' && newDs.sheetInfo.length) {
            let sheetOptions = [];
            newDs.sheetInfo.map((v) => {
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
                    {/* 
                    <Select className="basic-multi-select" classNamePrefix="select" isClearable={true} name="sheetOptions" options={sheetOptions} onChange={this.sheetSelectorOnChange} isMulti/>
                    <Col md={4} sm={4} xs={4}> 
                    <button onClick={this.sheetSelectionDone}> Done </button> 
                    </Col>
                    */}
                 </Row>
        }
        return s2;
    }

    rangeOnChange (event) {
        this.setState({ range: event.target.value });
    }
    rangeSelectionDone () {
        const { newDs, dispatch } = this.props;
        dispatch(newDsActions.loadHdrsFromRange(newDs.fileName, newDs.selectedSheet, this.state.range));
    }
    autoDetectRange () {
        const { newDs, dispatch } = this.props;
        if (newDs && newDs.fileName && newDs.selectedSheet) {
            dispatch(newDsActions.autoDetectRange(newDs.fileName, newDs.selectedSheet));
        }
    }

    step3 () {
        const { newDs } = this.props;
        let s3 = '';
        if (newDs && newDs.selectedSheet && newDs.selectedSheet.length) {
            s3 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 3.</b> Specify range (must include hdrs):
                    </Col>
                    <Col md={3} sm={3} xs={3}> 
                    <Form.Control type="text" value={this.state.range} onChange={this.rangeOnChange} />
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Button onClick={this.autoDetectRange.bind(this)} variant="secondary" style={{marginRight: '5px'}}> Auto Detect Range </Button> 
                    <Button onClick={this.rangeSelectionDone}> Validate </Button> 
                    </Col>
                 </Row>
        }
        return s3;
    }

    step3Status () {
        const { newDs } = this.props;
        let s3Status = '';
        let statusJsx;
        // Check for auto-detect errors
        try {
            if (newDs.autoDetectError) {
                statusJsx = <b style={{color: 'red'}}> Auto-detect error: {newDs.autoDetectError.error || newDs.autoDetectError} </b>;
            }
        } catch (e) {}
        // Check for range validation errors
        try {
            if (!newDs.loadStatus.loadStatus) {
                statusJsx = <b style={{color: 'red'}}> {newDs.loadStatus.error} </b>;
            }
        } catch (e) {}
        try {
            if (!newDs.loadStatus.loadStatus) {
                if (Object.keys(newDs.loadStatus.hdrErrors).length) {
                    statusJsx = Object.entries(newDs.loadStatus.hdrErrors).map ((kv) => {
                        return <div>[ {kv[0]} ] : [ <b style={{color: 'red'}}> {kv[1]} </b> ] </div>
                    })
                } else {
                    statusJsx = <b style={{color: 'red'}}> {newDs.loadStatus.error} </b>;
                }
            }
        } catch (e) {}
        if (statusJsx) {
            s3Status = <Row>
                            <Col md={12} sm={12} xs={12}> 
                            <b>Error: </b>{statusJsx}
                            </Col>                        
                       </Row>
        }
        return s3Status;
    }

    keySelectorOnChange (value) {
        const { dispatch } = this.props;
        console.log(value);
        let flatKeys = [];
        if ( value ) {
            value.map((v) => {
                flatKeys.push(v.value);
            })
        }
        console.log(flatKeys);
        dispatch(newDsActions.setSelectedKeys(flatKeys));
        // Drop the result on the floor if you are no longer the selected value. 
        // This is required for race-conditions when the user rapidly changes the
        // selection. 
        // Or add a button to do the actual network call. OR find a way to disable
        // the component until call completes..
    }

    step4 () {
        const { newDs } = this.props;
        let s4 = '';
        if (newDs && newDs.loadStatus && newDs.loadStatus.loadStatus && newDs.loadStatus.hdrs && Object.keys(newDs.loadStatus.hdrs).length) {
            let hdrOptions = [];
            Object.entries(newDs.loadStatus.hdrs).map((kv) => {
                let row = {};
                row.value = kv[1];
                row.label = kv[1];
                hdrOptions.push(row);
            });
            s4 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 4.</b> Select key(s):
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Select className="basic-multi-select" classNamePrefix="select" isClearable={true} name="sheetOptions" options={hdrOptions} onChange={this.keySelectorOnChange} isMulti/>
                    </Col>
                 </Row>
        }
        return s4;
    }

    dsNameOnChange (event) {
        let value = event.target.value;
        if (!value || (value.match(/^[a-zA-Z][a-zA-Z0-9_]*$/g) && value.length <= 64))
            this.setState({ dsName: event.target.value });
    }
    createDs () {
        const { newDs, dispatch, user } = this.props;
        dispatch(newDsActions.createDs(newDs.fileName, newDs.selectedSheet, newDs.selectedRange, newDs.selectedKeys, this.state.dsName, user.user));
    }
    step5 () {
        const { newDs } = this.props;
        let s5 = '';
        if (newDs && newDs.loadStatus && newDs.loadStatus.loadStatus && newDs.loadStatus.hdrs && Object.keys(newDs.loadStatus.hdrs).length) {
            s5 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 5.</b> Specify dataset name:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form.Control type="text" value={this.state.dsName} onChange={this.dsNameOnChange} />
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Button onClick={this.createDs}> Create </Button> 
                    </Col>
                 </Row>
        }
        return s5;
    }

    step5Status () {
        const { newDs } = this.props;
        let s5Status = '';

        try {
            if (newDs.createStatus.error) {
                s5Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                    <b style={{color: 'red'}}>{newDs.createStatus.error}</b>
                                </Col>
                           </Row>
            } else if (newDs.createStatus.loadStatus && this.state.dsName !== "") {
                let url = `/ds/${this.state.dsName}/default`;
                s5Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                    <b style={{color: 'green'}}>Successfully created: </b>
                                    <Link to={url}>Click here for your dataset</Link>
                                </Col>
                           </Row>
            }
        } catch (e) {}
        return s5Status;
    }

    render () {
        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <h3 style={{ 'float': 'center' }}><label className="underline">New Dataset from xls file</label></h3>
                    </Col>
                </Row>
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
                <br/>
                {this.step5()}
                <br/>
                {this.step5Status()}
            </div>
        );
    }

}

function mapStateToProps(state) {
    const { user } = state.authentication;
    const { home } = state;
    const { newDs } = state;
    return {
        user,
        home,
        newDs
    }
}

const cNewDsFromXls = connect(mapStateToProps)(NewDsFromXls);


export default cNewDsFromXls