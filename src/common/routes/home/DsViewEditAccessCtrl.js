import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Col, Form, Button } from 'react-bootstrap'

class AccessCtrl extends React.Component {
    constructor (props) {
        super (props)
        this.state = {
            accessCtrl: false,
            acl: null,

            debounceTimers: {}
        };
    }

    render () {
        const { dispatch, dsName, dsView, user, dsHome } = this.props;
        let me = this;

        try {
            if (this.state.acl === null && dsHome.dsViews[dsView].aclConfig) {
                let acl = "";
                if (typeof dsHome.dsViews[dsView].aclConfig.acl === "string") {
                    acl = dsHome.dsViews[dsView].aclConfig.acl;
                } else if (Array.isArray(dsHome.dsViews[dsView].aclConfig.acl)) {
                    for (let i = 0; i < dsHome.dsViews[dsView].aclConfig.acl.length; i++) {
                        acl += dsHome.dsViews[dsView].aclConfig.acl[i];
                        if (i < dsHome.dsViews[dsView].aclConfig.acl.length - 1) 
                            acl += ", ";
                    }
                }
                this.setState({ accessCtrl: dsHome.dsViews[dsView].aclConfig.accessCtrl, 
                                acl: acl
                             });
            }
        } catch (e) {};

        // https://reactjs.org/blog/2017/11/28/react-v16.2.0-fragment-support.html
        return (
            <>
            <Row>
                    <Col md={2} sm={2} xs={2}> 
                    <Form.Check inline type="checkbox" label="&nbsp;Add access-control" checked={this.state.accessCtrl} onChange={(event) => {
                                    let checked = event.target.checked;
                                    me.setState({accessCtrl: checked});
                                    let aclArray = [];
                                    let tmpArr = this.state.acl.split(',');
                                    for (let i = 0; i < tmpArr.length; i++) {
                                        let item = tmpArr[i].trim();
                                        if (item) aclArray.push(item);
                                    }
                                    if (!checked) {
                                        aclArray = []; aclArray.push(user.user);
                                    } else {
                                        if (!aclArray.includes(user.user)) aclArray.push(user.user);
                                    }
                                    me.props.onChange({accessCtrl: checked, acl: aclArray})
                                }}/>
                    </Col>
                    { this.state.accessCtrl && 
                        <Col md={6} sm={6} xs={6}> 
                        <Form.Control type="text" defaultValue={this.state.acl} onChange={(event) => {
                                let value = event.target.value;
                                if (me.state.debounceTimers["__accessCtrl"]) {
                                    clearTimeout(me.state.debounceTimers["__accessCtrl"]);
                                }
                                me.state.debounceTimers["__accessCtrl"] = setTimeout(() => {
                                    delete me.state.debounceTimers["__accessCtrl"];
                                    if (!value) return;
                                    me.setState({acl: value});
                                    let aclArray = [];
                                    let tmpArr = value.split(',');
                                    for (let i = 0; i < tmpArr.length; i++) {
                                        let item = tmpArr[i].trim();
                                        if (item) aclArray.push(item);
                                    }
                                    me.props.onChange({accessCtrl: this.state.accessCtrl, acl: aclArray});
                                }, 1000)
                            }} />
                        </Col> 
                    }

            </Row>
            </>
        );
    }
}

AccessCtrl.propTypes = {
    onChange: PropTypes.func.isRequired, 
    /*
    onClose: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    tableRef: PropTypes.object.isRequired,
    show: PropTypes.bool,
    dsName: PropTypes.string.isRequired,
    dsView: PropTypes.string.isRequired,
    children: PropTypes.node,
    defaultValue: PropTypes.string */
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

const cAccessCtrl = connect(mapStateToProps)(AccessCtrl);

export default cAccessCtrl;