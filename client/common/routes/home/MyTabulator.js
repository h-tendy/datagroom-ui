import React, { Component } from 'react'
import { ReactTabulator } from 'react-tabulator';

class MyTabulator extends Component {
    constructor (props) {
        super(props);
        this.recordTabRef = this.recordTabRef.bind(this);
        this.ref = null;
    }
    // Without this, an edit of a cell used to lose the
    // scroll position of the ReactTabulator. Paging is not an issue
    shouldComponentUpdate (nextProps, nextState) {
        //console.log("Current Options: ", this.props.options);
        //console.log("Next options: ", nextProps.options);
        if (this.props.options.paginationSize !== nextProps.options.paginationSize || 
            this.props.options.chronology !== nextProps.options.chronology || 
            this.props.options.forceRefresh !== nextProps.options.forceRefresh) {
            return true;
        }
        return false;
    }
    componentDidUpdate () {
        //console.log("Component did update...: ", this.props.options);
    }
    componentWillUnmount () {
        this.ref = null;
    }
    recordTabRef (ref) {
        // innerref is there purely to forward the ref back to caller. 
        const { innerref } = this.props;
        this.ref = ref;
        innerref(ref);
        return true;
    }
    render () {
        return <ReactTabulator {...this.props} ref={this.recordTabRef} />
    }
}

export default MyTabulator