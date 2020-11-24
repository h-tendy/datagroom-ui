import React, { Component } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { newDsActions } from '../../actions/newDs.actions';
import Select from 'react-select';

class NewDsFromCsv extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: null,
            formData: null,
            range: "",
            dsName: ""
        };
        this.onFileSelect = this.onFileSelect.bind(this);
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
            dispatch(newDsActions.uploadCsvFile(remoteFileName, formData));
        }
    }

    componentDidMount () {
        const { dispatch } = this.props;
        dispatch(newDsActions.clearReduxStore());
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
        if (newDs && newDs.uploadStatus === 'success' && !newDs.hdrs.length) {
            s1Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                <b style={{color: 'red'}}>Failed to read the hdrs!</b>
                                </Col>
                        </Row>
        }
        return s1Status;
    }
    step2 () {
        const { newDs } = this.props;
        let s2 = '';
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs.length) {
            let hdrOptions = [];
            newDs.hdrs.map((v) => {
                let row = {};
                row.value = v;
                row.label = v;
                hdrOptions.push(row);
            });
            s2 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 2.</b> Select keys:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Select className="basic-multi-select" classNamePrefix="select" isClearable={true} name="keys" options={hdrOptions} onChange={this.keySelectorOnChange} isMulti/>
                    </Col>
                 </Row>
        }
        return s2;
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
        if (newDs && newDs.uploadStatus === 'success' && newDs.hdrs.length) {
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
                {this.step2()}
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