import React from 'react'

//locking cell across all clients, maintain cell edit history
//Row insertion + column insertion
export default class CustomCell extends React.Component {
    constructor(props) {
        super(props);
    }

    render(){
        return (<div>{this.props.value.toString()}</div>)
    }
}