import React, { Component } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { newDsActions } from './NewDsStoreMgmt';
import Select from 'react-select';

class NewDsFromCsv extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: null,
            formData: null,
            range: "",
            dsName: "",
            csvInfoValidated: false
        };
        this.onFileSelect = this.onFileSelect.bind(this);
        this.keySelectorOnChange = this.keySelectorOnChange.bind(this);
        this.dsNameOnChange = this.dsNameOnChange.bind(this);
        this.createDs = this.createDs.bind(this);
        this.autoDetectRange = this.autoDetectRange.bind(this);
        this.rangeSelectionDone = this.rangeSelectionDone.bind(this);
        this.rangeOnChange = this.rangeOnChange.bind(this);
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
            this.setState({ file, formData, range: "", csvInfoValidated: false });
            dispatch(newDsActions.uploadCsvFile(remoteFileName, formData));
        }
    }

    componentDidMount () {
        const { dispatch } = this.props;
        dispatch(newDsActions.clearReduxStore());
    }

    componentDidUpdate (prevProps) {
        const { newDs } = this.props;
        // If auto-detected range info is available, update the range display
        if (newDs && newDs.autoDetectedRangeInfo && newDs.autoDetectedRangeInfo.status) {
            let infoText = `${newDs.autoDetectedRangeInfo.rowCount} rows, ${newDs.autoDetectedRangeInfo.columnCount} columns`;
            if (this.state.range !== infoText) {
                this.setState({ range: infoText });
            }
        }
    }

    autoDetectRange () {
        const { newDs, dispatch } = this.props;
        if (newDs && newDs.fileName) {
            dispatch(newDsActions.autoDetectRangeInfo(newDs.fileName));
        }
    }

    rangeOnChange (event) {
        this.setState({ range: event.target.value });
    }

    rangeSelectionDone () {
        // For CSV, validation just confirms the info is loaded
        const { newDs } = this.props;
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs && newDs.hdrs.length) {
            this.setState({ csvInfoValidated: true });
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
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs && !newDs.hdrs.length) {
            s1Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                <b style={{color: 'red'}}>Failed to read the hdrs!</b>
                                </Col>
                        </Row>
        }
        return s1Status;
    }
    step3 () {
        const { newDs } = this.props;
        let s3 = '';
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs && newDs.hdrs.length) {
            s3 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 3.</b> Specify range (must include hdrs):
                    </Col>
                    <Col md={3} sm={3} xs={3}> 
                    <Form.Control type="text" value={this.state.range} onChange={this.rangeOnChange} placeholder="File info will appear here" />
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Button onClick={this.autoDetectRange} variant="secondary" style={{marginRight: '5px'}}> Auto Detect Range </Button> 
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
        // Show success message if validated
        if (this.state.csvInfoValidated && newDs && newDs.uploadStatus === 'success' && newDs.hdrs && newDs.hdrs.length) {
            statusJsx = <b style={{color: 'green'}}> File info validated successfully </b>;
        }
        if (statusJsx) {
            s3Status = <Row>
                            <Col md={12} sm={12} xs={12}> 
                            {statusJsx}
                            </Col>                        
                       </Row>
        }
        return s3Status;
    }

    step4 () {
        const { newDs } = this.props;
        let s4 = '';
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs && newDs.hdrs.length && this.state.csvInfoValidated) {
            let hdrOptions = [];
            newDs.hdrs.map((v) => {
                let row = {};
                row.value = v;
                row.label = v;
                hdrOptions.push(row);
            });
            s4 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 4.</b> Select key(s):
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Select className="basic-multi-select" classNamePrefix="select" isClearable={true} name="keys" options={hdrOptions} onChange={this.keySelectorOnChange} isMulti/>
                    </Col>
                 </Row>
        }
        return s4;
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


    dsNameOnChange (event) {
        let value = event.target.value;
        if (!value || (value.match(/^[a-zA-Z][a-zA-Z0-9_]*$/g) && value.length <= 64))
            this.setState({ dsName: event.target.value });
    }
    createDs () {
        const { newDs, dispatch, user } = this.props;
        dispatch(newDsActions.createDsViaCsv(newDs.fileName, newDs.selectedKeys, this.state.dsName, user.user));
    }
    step5 () {
        const { newDs } = this.props;
        let s5 = '';
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs && newDs.hdrs.length && this.state.csvInfoValidated) {
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
        const { newDs } = this.props;
        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <h3 style={{ 'float': 'center' }}><label className="underline">New Dataset from csv file</label></h3>
                    </Col>
                </Row>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 1.</b> Select csv file:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form.Control type="file" name="file" onChange={this.onFileSelect} />
                    </Col>
                </Row>
                {this.step1Status()}
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

const cNewDsFromCsv = connect(mapStateToProps)(NewDsFromCsv);


export default cNewDsFromCsv