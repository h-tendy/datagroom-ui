import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Col, Form, Button } from 'react-bootstrap'
import { dsActions } from '../../actions/ds.actions';
import Select from 'react-select';
import { dsConstants } from '../../constants';

class FilterControls extends React.Component {
    constructor (props) {
        super (props)
        this.state = {
            save: false, 
            saveName: null,
            saveErrorMsg: '', 
            saveDescription: null,

            saveAsNew: false,
            saveAsNewName: '',
            saveAsNewDescription: '',
            saveAsNewErrorMsg: '',

            deleteFilter: false,
            deleteFilterErrorMsg: ''
        };
        this.deleteFilterControls = this.deleteFilterControls.bind(this);
        this.saveControls = this.saveControls.bind(this);
        this.saveAsNewControls = this.saveAsNewControls.bind(this);
    }

    deleteFilterControls () {
        let returnJsx = "";
        let me = this;
        const { dispatch, dsName, dsView, user, dsHome } = this.props;
        let name = this.props.defaultValue;

        if (this.state.deleteFilter) {
            try {
                if (dsHome.dsFilterDeletes[dsView].status === 'success' && dsHome.dsFilterDeletes[dsView].serverStatus.status === 'success' && this.state.deleteFilter) {
                    dispatch({ type: dsConstants.CLEAR_DELETE_FILTER_TRACKER });
                    this.setState({ deleteFilter: false });
                }
            } catch (e) {}

            returnJsx = 
            <>
            <Row>
                <Col md={4} sm={4} xs={4}> 
                    <b>Delete:</b> {name} ? &nbsp;&nbsp; 
                    <Button size="sm" onClick={() => {
                        if (!me.props.tableRef) return;
                        if (!this.props.defaultValue) {
                            // Set an error message to first select from dropdown
                            return;
                        }
                        me.setState({ deleteFilterErrorMsg: '' });
                        console.log("State: ", me.state);
                        dispatch(dsActions.deleteFilter(dsName, dsView, user.user, { name }));
                        setTimeout(() => {dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user));}, 500);

                        me.setState({ saveName: null, saveDescription: null })
                        me.props.onFilterChange(null);
                    }}> 
                        Confirm delete
                    </Button>
                    {this.state.deleteFilterErrorMsg && 
                    <b style={{color: "red"}}> {this.state.deleteFilterErrorMsg} </b>}
                </Col>
            </Row>
            </>
        }
        return returnJsx;
    }


    saveControls () {
        let returnJsx = "";
        let me = this;
        const { dispatch, dsName, dsView, user, dsHome } = this.props;
        let name = this.props.defaultValue;

        if (this.state.save) {
            try {
                // This is way too subtle. Initially, we set saveDescription to 'null. 
                // Then, we initialize it just once when we have the store ready. 
                if (this.state.saveName !== name) {
                    this.setState({ saveName: name, saveDescription: dsHome.dsViews[dsView].filters[name].description});
                }
            } catch (e) { return "" }
            try {
                if (dsHome.dsFilterEdits[dsView].status === 'fail' || dsHome.dsFilterEdits[dsView].serverStatus.status === 'fail') {
                    let errMsg = 'save failed';
                    if (this.state.saveErrorMsg !== errMsg)
                        this.setState({ saveErrorMsg: errMsg });
                }
            } catch (e) {}
            try {
                if (dsHome.dsFilterEdits[dsView].status === 'success' && dsHome.dsFilterEdits[dsView].serverStatus.status === 'success' && this.state.save) {
                    dispatch({ type: dsConstants.CLEAR_EDIT_FILTER_TRACKER });
                    this.setState({ save: false });
                }
            } catch (e) {}
            returnJsx = 
            <>
            <Row>
                <Col md={2} sm={2} xs={2}> 
                    <b>Saving to:</b>
                </Col>
                <Col md={4} sm={4} xs={4}> 
                    {name}
                </Col>
            </Row> <br/>
            <Row>
                <Col md={2} sm={2} xs={2}> 
                    <b>Description: </b>
                </Col>
                <Col md={4} sm={4} xs={4}> 
                    <Form.Control as="textarea" size="sm" rows="3" value={this.state.saveDescription} onChange={(event) => {
                        let value = event.target.value;
                        me.setState({saveDescription: value})
                    }} />
                </Col>
                <Col md={4} sm={4} xs={4}> 
                    <Button size="sm" onClick={() => {
                        if (!me.props.tableRef) return;
                        if (!this.props.defaultValue) {
                            // Set an error message to first select from dropdown
                            return;
                        }
                        me.setState({ saveErrorMsg: '' });
                        let hdrFilters = me.props.tableRef.table.getHeaderFilters();
                        let hdrSortersTmp = me.props.tableRef.table.getSorters();
                        let hdrSorters = [];
                        for (let i = 0; i < hdrSortersTmp.length; i++) {
                            let sorter = {};
                            sorter.column = hdrSortersTmp[i].field;
                            sorter.dir = hdrSortersTmp[i].dir;
                            hdrSorters.push(sorter);
                        }
                        let filterColumnAttrs = {};
                        let cols = me.props.tableRef.table.getColumns();
                        for (let i = 0; i < cols.length; i++) {
                            let field = cols[i].getField();
                            let attrsForField = {};
                            if (!cols[i].isVisible()) {
                                attrsForField.hidden = true;
                            }
                            attrsForField.width = cols[i].getWidth();
                            filterColumnAttrs[field] = attrsForField;
                        }
                
                        console.log("State: ", me.state);
                        let newFilter = {};
                        newFilter.name = name; 
                        newFilter.description = me.state.saveDescription;
                        newFilter.hdrFilters = hdrFilters;
                        newFilter.hdrSorters = hdrSorters;
                        newFilter.filterColumnAttrs = filterColumnAttrs;
                        console.log("Save Filter object: ", newFilter);
                        dispatch(dsActions.editFilter(dsName, dsView, user.user, newFilter));
                        setTimeout(() => {dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user));}, 500);
                    }}> 
                        Save
                    </Button>
                    {this.state.saveErrorMsg && 
                    <b style={{color: "red"}}> {this.state.saveErrorMsg} </b>}
                </Col>
            </Row>
            </>

        }
        return returnJsx;
    }

    saveAsNewControls () {
        let returnJsx = "";
        let me = this;
        const { dispatch, dsName, dsView, user, dsHome } = this.props;

        if (this.state.saveAsNew) {

            try {
                if (dsHome.dsFilterAdds[dsView].status === 'fail' || dsHome.dsFilterAdds[dsView].serverStatus.status === 'fail') {
                    let errMsg = 'save as new failed, try with new name maybe. Or try "save" instead';
                    if (this.state.saveAsNewErrorMsg !== errMsg)
                        this.setState({ saveAsNewErrorMsg: errMsg });
                }
            } catch (e) {}
            try {
                if (dsHome.dsFilterAdds[dsView].status === 'success' && dsHome.dsFilterAdds[dsView].serverStatus.status === 'success' && this.state.saveAsNew) {
                    dispatch({ type: dsConstants.CLEAR_ADD_FILTER_TRACKER });
                    this.setState({ saveAsNew: false, saveAsNewName: '', saveAsNewDescription: '' });
                }
            } catch (e) {}

            returnJsx = 
            <>
            <Row>
                <Col md={2} sm={2} xs={2}> 
                    <b>Filter name:</b>
                </Col>
                <Col md={4} sm={4} xs={4}> 
                    <Form.Control type="text" size="sm" value={this.state.saveAsNewName} onChange={(event) => {        
                        let value = event.target.value;
                        if (!value || (value.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/g) && value.length <= 64)) {
                            me.setState({ saveAsNewName: event.target.value });
                        }
                    }} />
                </Col>
                <Col md={4} sm={4} xs={4}> 
                    <Button size="sm" onClick={() => {
                        if (!me.props.tableRef) return;
                        if (!this.state.saveAsNewName) {
                            me.setState({ saveAsNewErrorMsg: 'Name is mandatory' });
                            return;
                        }
                        me.setState({ saveAsNewErrorMsg: '' });
                        let hdrFilters = me.props.tableRef.table.getHeaderFilters();
                        let hdrSortersTmp = me.props.tableRef.table.getSorters();
                        let hdrSorters = [];
                        for (let i = 0; i < hdrSortersTmp.length; i++) {
                            let sorter = {};
                            sorter.column = hdrSortersTmp[i].field;
                            sorter.dir = hdrSortersTmp[i].dir;
                            hdrSorters.push(sorter);
                        }
                        let filterColumnAttrs = {};
                        let cols = me.props.tableRef.table.getColumns();
                        for (let i = 0; i < cols.length; i++) {
                            let field = cols[i].getField();
                            let attrsForField = {};
                            if (!cols[i].isVisible()) {
                                attrsForField.hidden = true;
                            }
                            attrsForField.width = cols[i].getWidth();
                            filterColumnAttrs[field] = attrsForField;
                        }
                
                        let newFilter = {};
                        newFilter.name = this.state.saveAsNewName;
                        newFilter.description = this.state.saveAsNewDescription;
                        newFilter.hdrFilters = hdrFilters;
                        newFilter.hdrSorters = hdrSorters;
                        newFilter.filterColumnAttrs = filterColumnAttrs;
                        console.log("New Filter object: ", newFilter);
                        dispatch(dsActions.addFilter(dsName, dsView, user.user, newFilter)); 
                        setTimeout(() => {dispatch(dsActions.loadColumnsForUserView(dsName, dsView, user.user));}, 500);

                        // XXX: Make this a function pls and reuse it. 
                        // This is needed so that we set this again for new selection
                        me.setState({ saveName: null, saveDescription: null })
                        console.log("Calling onFilterChange with:", this.state.saveAsNewName)
                        me.props.onFilterChange(this.state.saveAsNewName);

                        }}> 
                        Create 
                    </Button>
                    {this.state.saveAsNewErrorMsg && 
                    <b style={{color: "red"}}> {this.state.saveAsNewErrorMsg} </b>}
                </Col>
            </Row>
            <Row>
                <Col md={2} sm={2} xs={2}> 
                    <b>Description: </b>
                </Col>
                <Col md={4} sm={4} xs={4}> 
                    <Form.Control as="textarea" size="sm" rows="3" value={this.state.saveAsNewDescription} onChange={(event) => {
                        let value = event.target.value;
                        me.setState({saveAsNewDescription: value})
                    }} />
                </Col>
            </Row>
            </>
        }
        return returnJsx;
    }

    render () {
        const { dispatch, dsName, dsView, user, dsHome } = this.props;
        let me = this;
        if (!this.props.show) {
            return null;
        }
        let filterOptions = [];
        let defaultValueIdx = -1;
        try {
            let keys = Object.keys(dsHome.dsViews[dsView].filters);
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] === '_id') continue;
                let row = {};
                row.value = keys[i];
                row.label = keys[i];
                if (this.props.defaultValue === keys[i]) {
                    defaultValueIdx = i - 1; // because we are skipping _id
                    console.log("Setting defaultValueIdx to:", defaultValueIdx);
                }
                filterOptions.push(row);
            }
        } catch (e) {}
        // https://reactjs.org/blog/2017/11/28/react-v16.2.0-fragment-support.html
        return (
            <>
            <Row>
                    <Col md={1} sm={1} xs={1}> 
                    <b>Filters:</b>
                    </Col>
                    <Col md={8} sm={8} xs={8}> 
                    <Select key={`my_unique_select_key__${JSON.stringify(filterOptions[defaultValueIdx])}`} className="basic-single" classNamePrefix="select" isClearable={true} name="sheetOptions" defaultValue={filterOptions[defaultValueIdx]} value={filterOptions[defaultValueIdx]} options={filterOptions} onChange={(value) => { 
                        // This is needed so that we set this again for new selection
                        me.setState({ saveName: null, saveDescription: null })
                        if (value) {
                            me.props.onFilterChange(value.value)
                        } else {
                            me.setState({ saveAsNew: false, save: false });
                            me.props.onFilterChange(null);
                        }
                    }}/>
                    </Col>
            </Row>
            <Row>
                <button className="btn btn-link" onClick={() => { me.setState({ saveAsNew: !this.state.saveAsNew, save: false, deleteFilter: false }) }}> <i class='fas fa-filter'></i> Save-as-new-filter </button> | 
                <button className="btn btn-link" onClick={() => { me.setState({ save: !this.state.save, saveAsNew: false, deleteFilter: false }) }}> <i class='fas fa-save'></i> Save </button> | 
                <button className="btn btn-link" onClick={() => { me.setState({ deleteFilter: !this.state.deleteFilter, save: false, saveAsNew: false }) }}> <i class='fas fa-trash-alt'></i> Delete-filter </button>
            </Row>
            {this.saveAsNewControls()}
            {this.saveControls()}
            {this.deleteFilterControls()}
            </>
        );
    }
}

FilterControls.propTypes = {
    onClose: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    tableRef: PropTypes.object.isRequired,
    show: PropTypes.bool,
    dsName: PropTypes.string.isRequired,
    dsView: PropTypes.string.isRequired,
    children: PropTypes.node,
    defaultValue: PropTypes.string
};

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

const cFilterControls = connect(mapStateToProps)(FilterControls);

export default cFilterControls;