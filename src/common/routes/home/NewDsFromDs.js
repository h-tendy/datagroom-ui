import React, { Component } from 'react'
import { Row, Col, Form, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { newDsActions } from './NewDsStoreMgmt';
import { dsActions } from '../../actions/ds.actions';
import Select from 'react-select';

class NewDsFromDs extends Component {
    constructor(props) {
        super(props)
        this.state = {
            fromDsName: "",
            toDsName: "",
            retainData: true,
            incompleteInputErr: ""
        };
        this.dsSelectorOnChange = this.dsSelectorOnChange.bind(this);
        this.dsNameOnChange = this.dsNameOnChange.bind(this);
        this.createDs = this.createDs.bind(this);
    }

    componentDidMount () {
        const { dispatch, user } = this.props;
        dispatch(newDsActions.clearReduxStore());
        dispatch(dsActions.getDsList(user.user));
    }

    componentWillUnmount () {
    }

    dsSelectorOnChange (value) {
        if (value)        
            this.setState({ fromDsName: value.value });
        else 
            this.setState({ fromDsName: "" });
    }
    step1 () {
        const { allDs } = this.props;
        let s1 = '';
        try {
            let sheetOptions = [];

            allDs.dsList.dbList.map((v) => {
                let row = {};
                row.value = v.name;
                row.label = v.name;
                sheetOptions.push(row);
            })
            s1 = <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 1.</b> Select From DS:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Select className="basic-single" classNamePrefix="select" isClearable={true} name="sheetOptions" options={sheetOptions} onChange={this.dsSelectorOnChange}/>
                    </Col>
                 </Row>

            return s1;
        } catch (e) {}

        return s1;
    }

    dsNameOnChange (event) {
        let value = event.target.value;
        if (!value || (value.match(/^[a-zA-Z][a-zA-Z0-9_]*$/g) && value.length <= 64))
            this.setState({ toDsName: event.target.value });
    }
    createDs () {
        const { newDs, dispatch, user } = this.props;
        console.log(`createDs: ${this.state.fromDsName}, ${this.state.toDsName}, ${this.state.retainData}`);
        if (!this.state.toDsName) {
            this.setState({incompleteInputErr: "Specify new DS name!"});
        } else if (!this.state.fromDsName) {
            this.setState({incompleteInputErr: "Select FROM DS name!"});
        } else {
            this.setState({incompleteInputErr: ""});
        }
        dispatch(newDsActions.createDsFromDs(this.state.fromDsName, this.state.toDsName, user.user, this.state.retainData));
    }
    step2 () {
        const { newDs } = this.props;
        let s2 = '', me = this;
        if (!this.state.fromDsName) return s2;

        try {
            s2 =<div>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form.Check type="checkbox" label="&nbsp; Retain data" checked={this.state.retainData} onChange={(event) => {
                            me.setState({retainData: event.target.checked
                        });
                    }}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <b>Step 2.</b> Specify new dataset name:
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Form.Control type="text" value={this.state.toDsName} onChange={this.dsNameOnChange} />
                    </Col>
                    <Col md={4} sm={4} xs={4}> 
                    <Button onClick={this.createDs}> Create </Button> 
                    </Col>
                </Row>
                </div>
        } catch (e) {};

        return s2;
    }

    step2Status () {
        const { newDs } = this.props;
        let s5Status = '';

        try {
            if (this.state.incompleteInputErr) {
                s5Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                    <b style={{color: 'red'}}>{this.state.incompleteInputErr}</b>
                                </Col>
                           </Row>
            } else if (newDs.createStatus.error) {
                s5Status = <Row>
                                <Col md={6} sm={6} xs={6}> 
                                    <b style={{color: 'red'}}>{newDs.createStatus.error}</b>
                                </Col>
                           </Row>
            } else if (newDs.createStatus.createStatus && this.state.toDsName !== "") {
                let url = `/ds/${this.state.toDsName}/default`;
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
                    <h3 style={{ 'float': 'center' }}><label className="underline">Copy Dataset from an existing Dataset</label></h3>
                    </Col>
                </Row>
                {this.step1()}
                <br/>
                {this.step2()}
                <br/>
                {this.step2Status()}
            </div>
        );
    }

}

function mapStateToProps(state) {
    const { user } = state.authentication;
    const { home } = state;
    const { newDs } = state;
    const { allDs } = state;
    return {
        user,
        home,
        newDs,
        allDs
    }
}

const cNewDsFromDs = connect(mapStateToProps)(NewDsFromDs);


export default cNewDsFromDs