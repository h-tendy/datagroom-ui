import React from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from "react-router-dom";

class PrivateRoute extends React.Component {

    render() {
        const { loggedIn } = this.props;
        const { component: Component, ...rest } = this.props;
        return (
            <Route {...rest} render={props => (
                //localStorage.getItem('user')
                loggedIn
                    ? <Component {...props} />
                    : <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
            )} />        
        );
    }
}

function mapStateToProps(state) {
    const { loggedIn } = state.authentication;
    return {
        loggedIn,
    }
}

const connectedPrivateRoute = connect(mapStateToProps)(PrivateRoute);
export { connectedPrivateRoute as PrivateRoute }; 