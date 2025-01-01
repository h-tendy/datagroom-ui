// @ts-check
import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Form, Button } from 'react-bootstrap'

class PerRowAccessCtrl extends React.Component {
    constructor (props) {
        super (props)
        this.debounceTimers = {};
    }

    render() {
        let { config } = this.props;
        let me = this;

        if (!config) config = {};
        // https://reactjs.org/blog/2017/11/28/react-v16.2.0-fragment-support.html
        return (
            <>
                <Row>
                    <Col md={2} sm={2} xs={2}>
                        <Form.Check inline type="checkbox" label="&nbsp;Per-row  access-control" checked={config.enabled} onChange={(event) => {
                            let checked = event.target.checked;
                            me.props.onChange({ ...config, enabled: checked })
                        }} />
                    </Col>
                    {config.enabled &&
                        <Col md={6} sm={6} xs={6}>
                            <Form.Control type="text" defaultValue={config.column} onChange={(event) => {
                                let value = event.target.value;
                                if (me.debounceTimers["__column"]) {
                                    clearTimeout(me.debounceTimers["__column"]);
                                }
                                me.debounceTimers["__column"] = setTimeout(() => {
                                    delete me.debounceTimers["__column"];
                                    if (!value) return;
                                    me.props.onChange({ ...config, column: value });
                                }, 1000)
                            }} />
                        </Col>
                    }
                </Row>
            </>
        );
    }
}

PerRowAccessCtrl.propTypes = {
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


export default PerRowAccessCtrl;