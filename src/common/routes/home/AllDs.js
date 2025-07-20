import React, { Component } from 'react'
import { Row, Col, Button } from 'react-bootstrap'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom'
import { dsActions } from '../../actions/ds.actions';
import 'react-tabulator/lib/styles.css'; // required styles
import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { allDsConstants } from '../../constants';
import { history } from '../../helpers';
import '../../components/AllDs.css';

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
            searchText: '',
            sortBy: 'A-Z',
            expandedInfo: {}, // Track which cards have info expanded
            globalInfoExpanded: false, // Track global info expansion
        };
        this.toggleViewMode = this.toggleViewMode.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.toggleInfo = this.toggleInfo.bind(this);
        this.toggleGlobalInfo = this.toggleGlobalInfo.bind(this);
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

    handleSearchChange(e) {
        this.setState({ searchText: e.target.value });
    }

    handleSortChange(e) {
        this.setState({ sortBy: e.target.value });
    }

    toggleInfo(dsName) {
        this.setState(prevState => ({
            expandedInfo: {
                ...prevState.expandedInfo,
                [dsName]: !prevState.expandedInfo[dsName]
            }
        }));
    }

    toggleGlobalInfo() {
        const { allDs } = this.props;
        this.setState(prevState => {
            const newGlobalInfoExpanded = !prevState.globalInfoExpanded;
            const newExpandedInfo = {};
            
            if (newGlobalInfoExpanded) {
                // Add all datasets to expandedInfo
                allDs.dsList.dbList.forEach(ds => {
                    newExpandedInfo[ds.name] = true;
                });
            }
            // If false, newExpandedInfo remains empty, clearing all expansions
            
            return {
                globalInfoExpanded: newGlobalInfoExpanded,
                expandedInfo: newExpandedInfo
            };
        });
    }

    dsList () {
        const { allDs } = this.props;
        const { viewMode, searchText, sortBy } = this.state;
        try {
            if (allDs.dsListStatus === 'loading') {
                return <h5>Loading....</h5>
            } else if (allDs.dsListStatus === 'success') {
                let dbList = allDs.dsList.dbList;
                if (!dbList || dbList.length === 0) {
                    return (
                        <div className="no-datasets-container">
                            <span role="img" aria-label="sad" className="no-datasets-emoji">😢</span>
                            No datasets found.
                        </div>
                    );
                }
                let filteredList = dbList;
                if (searchText && searchText.trim() !== '') {
                    const search = searchText.trim().toLowerCase();
                    filteredList = filteredList.filter(ds => ds.name.toLowerCase().includes(search));
                }
                // Sort logic
                if (sortBy === 'A-Z') {
                    filteredList = filteredList.slice().sort((a, b) => a.name.localeCompare(b.name));
                } else if (sortBy === 'Z-A') {
                    filteredList = filteredList.slice().sort((a, b) => b.name.localeCompare(a.name));
                } else if (sortBy === 'SIZE_ASC') {
                    filteredList = filteredList.slice().sort((a, b) => (a.sizeOnDisk || 0) - (b.sizeOnDisk || 0));
                } else if (sortBy === 'SIZE_DESC') {
                    filteredList = filteredList.slice().sort((a, b) => (b.sizeOnDisk || 0) - (a.sizeOnDisk || 0));
                }
                if (filteredList.length == 0) {
                    return (
                        <div className="no-datasets-container">
                            <span role="img" aria-label="sad" className="no-datasets-emoji">😢</span>
                            No datasets found.
                        </div>
                    );
                } else {
                    if (viewMode === 'list') {
                        // List view: ultra-compact cards
                        return (
                            <Row className="dataset-row-flex">
                                {filteredList.map((ds, idx) => (
                                    <Col key={ds.name} md={12} sm={12} xs={12} className="list-card-col">
                                        <div className="dataset-card dataset-card-box list-card">
                                            <div className="list-card-content">
                                                <Link to={`/ds/${ds.name}/default`} className="list-card-link">{ds.name}</Link>
                                                {(this.state.expandedInfo[ds.name]) && (
                                                    <>
                                                        <span className="list-card-separator">|</span>
                                                        <span className="list-card-info">
                                                            <strong>Owner:</strong> {ds.perms && ds.perms.owner ? ds.perms.owner : "Unknown"}
                                                        </span>
                                                        <span className="list-card-separator">|</span>
                                                        <span className="list-card-info">
                                                            <strong>Size:</strong> {this.formatSize(ds.sizeOnDisk)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <span className="list-card-actions">
                                                <span className="delete-btn">{this.deleteControls(ds.name)}</span>
                                                <span className="list-card-info-icon" onClick={() => this.toggleInfo(ds.name)} title="Toggle Info">
                                                    <i className="fas fa-info-circle"></i>
                                                </span>
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
                                {filteredList.map((ds, idx) => (
                                    <Col key={ds.name} md={3} sm={6} xs={12} className="grid-card-col">
                                        <div className="dataset-card dataset-card-box grid-card">
                                            <h5 className="grid-card-title">
                                                <Link to={`/ds/${ds.name}/default`} className="grid-card-link">{ds.name}</Link>
                                            </h5>
                                            <div className="grid-card-owner"><strong>Owner:</strong> {ds.perms && ds.perms.owner ? ds.perms.owner : "Unknown"}</div>
                                            <div className="grid-card-size-actions">
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
        const { sortBy } = this.state;
        return (
            <div>
                <div className="all-ds-container" />
                <Row className="all-ds-header-row">
                    <Col md={12} sm={12} xs={12} className="all-ds-header-col"> 
                        <div className="all-ds-title-container">
                            <h3 className="all-ds-title"><label className="underline">Your Datasets</label></h3>
                            <span style={{ cursor: 'pointer' }} onClick={this.toggleGlobalInfo} title="Toggle Info for All Datasets">
                                <i className={`fas fa-info-circle global-info-icon ${this.state.globalInfoExpanded ? 'active' : ''}`}></i>
                            </span>
                        </div>
                        <span className="all-ds-controls-container">
                            <span className="view-toggle-icon" onClick={this.toggleViewMode} title={this.state.viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
                                {this.state.viewMode === 'grid' ? (
                                    <i className="fas fa-list"></i>
                                ) : (
                                    <i className="fas fa-th"></i>
                                )}
                            </span>
                            <span className="search-container">
                                <i className="fas fa-search search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Search datasets..."
                                    value={this.state.searchText}
                                    onChange={this.handleSearchChange}
                                    className="search-input"
                                />
                            </span>
                            <span className="sort-dropdown-wrapper">
                                <label className="sort-dropdown-label">Sort by:</label>
                                <span className="sort-dropdown-container">
                                    <select
                                        className="sort-dropdown"
                                        value={this.state.sortBy}
                                        onChange={this.handleSortChange}
                                    >
                                        <option value="A-Z">A-Z</option>
                                        <option value="Z-A">Z-A</option>
                                        <option value="SIZE_ASC">DS Size (small to large)</option>
                                        <option value="SIZE_DESC">DS Size (large to small)</option>
                                    </select>
                                </span>
                            </span>
                            <span className="action-buttons-container">
                                <Button size="sm" className="action-button" onClick={() => {history.push('/newDsXlsx')}}> New Ds (xlsx)</Button> 
                                <Button size="sm" className="action-button" onClick={() => {history.push('/newDsCsv')}}> New Ds (csv)</Button> 
                                <Button size="sm" className="action-button" onClick={() => {history.push('/newDsFrmDs')}}> Copy Ds</Button> 
                            </span>
                        </span>
                    </Col>
                </Row>
                {/* Removed pageButton filter buttons */}
                {this.dsList()}
                <Row>
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