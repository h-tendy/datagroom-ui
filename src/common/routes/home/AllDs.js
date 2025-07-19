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
        // Remove pageTabs and activeTab state
        this.state = {
            viewMode: 'list', // 'grid' or 'list'
        };
        this.toggleViewMode = this.toggleViewMode.bind(this);
    }
    componentDidMount () {
        const { dispatch, user } = this.props;
        // Always fetch all datasets
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

    formatSize(bytes) {
        if (bytes === 0 || bytes == null) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    toggleViewMode() {
        this.setState((prevState) => ({
            viewMode: prevState.viewMode === 'grid' ? 'list' : 'grid'
        }));
    }

    dsList () {
        const { allDs } = this.props;
        const { viewMode } = this.state;
        try {
            if (allDs.dsListStatus === 'loading') {
                return <h5>Loading....</h5>
            } else if (allDs.dsListStatus === 'success') {
                if (allDs.dsList.dbList.length == 0) {
                    return <h3> OOPS..!! No Dataset found....!!</h3>
                } else {
                    if (viewMode === 'list') {
                        // List view: one card per row, half the screen width, left-aligned
                        return (
                            <Row className="dataset-row-flex">
                                {allDs.dsList.dbList.map((ds, idx) => (
                                    <Col key={ds.name} md={12} sm={12} xs={12} style={{ marginBottom: '12px' }}>
                                        <div className="dataset-card dataset-card-box" style={{ background: '#fff', borderRadius: '10px', padding: '24px 28px 18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '50vw', minWidth: 300, maxWidth: 700 }}>
                                            <Link to={`/ds/${ds.name}/default`} style={{ wordBreak: 'break-word', whiteSpace: 'normal', display: 'inline-block', fontSize: '1.15rem', fontWeight: 600 }}>{ds.name}</Link>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="delete-btn">{this.deleteControls(ds.name)}</span>
                                                <span style={{ borderLeft: '1.5px solid #ccc', height: 24, marginLeft: 16 }}></span>
                                            </span>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        );
                    } else {
                        // Grid view: 4 columns
                        return (
                            <Row className="dataset-row-flex">
                                {allDs.dsList.dbList.map((ds, idx) => (
                                    <Col key={ds.name} md={3} sm={6} xs={12} style={{ marginBottom: '24px' }}>
                                        <div className="dataset-card dataset-card-box" style={{ background: '#fff', borderRadius: '10px', padding: '24px 28px 18px 28px' }}>
                                            <h5 style={{ marginBottom: 12, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                <Link to={`/ds/${ds.name}/default`} style={{ wordBreak: 'break-word', whiteSpace: 'normal', display: 'inline-block' }}>{ds.name}</Link>
                                            </h5>
                                            <div style={{ marginBottom: 8 }}><strong>Owner:</strong> {ds.perms && ds.perms.owner ? ds.perms.owner : "Unknown"}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span><strong>Size:</strong> {this.formatSize(ds.sizeOnDisk)}</span>
                                                <span className="delete-btn">{this.deleteControls(ds.name)}</span>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        );
                    }
                }
            }
        } catch (e) {
            console.log('dsList, exception: ', e);
        }
        return '';
    }

    onFilterClickHandler = (e) => {
        // Remove filter handler logic
    }

    render () {
        document.title = "Datagroom - browse data-sets";
        return (
            <div>
                <div style={{height: 32}} />
                <Row style={{ alignItems: 'center', marginTop: 32, marginBottom: 32 }}>
                    <Col md={12} sm={12} xs={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}> 
                        <h3 style={{ margin: 0 }}><label className="underline">Your Datasets</label></h3>
                        <span style={{ cursor: 'pointer', marginRight: '24px' }} onClick={this.toggleViewMode} title={this.state.viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
                            {this.state.viewMode === 'grid' ? (
                                <i className="fas fa-th" style={{ fontSize: '2.5rem', color: '#333' }}></i>
                            ) : (
                                <i className="fas fa-list" style={{ fontSize: '2.5rem', color: '#333' }}></i>
                            )}
                        </span>
                    </Col>
                </Row>
                {/* Removed pageButton filter buttons */}
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