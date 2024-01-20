import React, { Component } from 'react'
import { Row, Col, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { dsActions } from '../../actions/ds.actions';
import 'react-tabulator/lib/styles.css'; // required styles
import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { allDsConstants } from '../../constants';
import { history } from '../../helpers';

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}

class AllDs extends Component {

    constructor(props) {
        super(props);
        this.deleteRequest = this.deleteRequest.bind(this);
        this.deleteControls = this.deleteControls.bind(this);
    }
    componentDidMount () {
        const { dispatch, user } = this.props;
        dispatch(dsActions.getDsList(user.user));
    }

    deleteRequest ( dsName ) {
        const { dispatch } = this.props;
        console.log( "Received delete request: ", dsName );
        dispatch({ type: allDsConstants.SEEKING_DELETE_CONFIRM, dsName })
    }

    confirmedDelete ( dsName ) {
        const { dispatch, user } = this.props;
        console.log( "Received delete confirmation! ", dsName );
        dispatch(dsActions.deleteDs(dsName, user.user));
    }

    deleteControls ( dsName ) {
        const { user, allDs } = this.props;
        let owner = ''
        for (let i = 0; i < allDs.dsList.dbList.length; i++) {
            if (allDs.dsList.dbList[i].name === dsName) {
                try {
                    owner = allDs.dsList.dbList[i].perms.owner;
                } catch (e) {
                    console.log(`Owner is not found for: ${dsName}`);
                    owner = user.user;
                }
                break;
            }
        }
        if (owner === user.user && allDs.deleteConfirm && allDs.deleteConfirm[dsName]) {
            return (<span> | <a href="##" onClick={() => {this.confirmedDelete(dsName)}}>Confirm Deletion please</a></span>)
        } else if (owner === user.user) {
            return (<span> | <a href="##" onClick={() => {this.deleteRequest(dsName)}}>Delete</a></span>)
        }
        return '';
    }

    dsList () {
        const { allDs } = this.props;
        try {
            let listItems = allDs.dsList.dbList.map((v) => {
                let url = `/ds/${v.name}/default`;
                return <li><Link to={url}>{v.name}</Link>{this.deleteControls(v.name)}</li>
            })
            return (<Row><Col md={12} sm={12} xs={12}><ul>{listItems}</ul></Col></Row>)
        } catch (e) {
            console.log('dsList, exception: ', e);
        }
        return '';
    }

    onFilterClickHandler = (e) => {
        e.preventDefault();
        const { dispatch, user } = this.props;
        if (e.target.innerText === "ALL DS") {
            dispatch(dsActions.getDsList(user.user));
        } else {
            dispatch(dsActions.getFilteredDsList(user.user, e.target.innerText));
        }
    }

    render () {
        document.title = "Datagroom - browse data-sets";
        return (
            <div>
                <Row>
                    <Col md={12} sm={12} xs={12}> 
                    <h3 style={{ 'float': 'center' }}><label className="underline">Your Datasets</label></h3>
                    </Col>
                </Row>
                <Button size="sm" onClick={this.onFilterClickHandler}> A-I</Button>
                <Button size="sm" onClick={this.onFilterClickHandler}> J-S</Button>
                <Button size="sm" onClick={this.onFilterClickHandler}> T-Z</Button>
                <Button size="sm" onClick={this.onFilterClickHandler}> 0-9</Button>
                <Button size="sm" onClick={this.onFilterClickHandler}> ALL DS</Button> 
                {this.dsList()}
                <Row>
                <Button size="sm" onClick={() => {history.push('/newDsXlsx')}}> New Ds (xlsx)</Button> 
                <Button size="sm" onClick={() => {history.push('/newDsCsv')}}> New Ds (csv)</Button> 
                <Button size="sm" onClick={() => {history.push('/newDsFrmDs')}}> Copy Ds</Button> 
                </Row>
            </div>
        );
    }

}

function mapStateToProps(state) {
    const { user } = state.authentication;
    const { home } = state;
    const { allDs } = state;
    return {
        user,
        home,
        allDs
    }
}

const cAllDs = connect(mapStateToProps)(AllDs);


export default cAllDs