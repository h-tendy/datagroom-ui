import React from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from "react-router-dom";
import { userActions } from '../actions';

class PrivateRoute extends React.Component {

    componentDidMount() {
        const { dispatch, user, loggedIn } = this.props;
        if (!loggedIn && user && user.token) {
            dispatch(userActions.sessionCheck(user))
        }
    }

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
    const { loggedIn, user } = state.authentication;
    return {
        loggedIn,
        user
    }
}

const connectedPrivateRoute = connect(mapStateToProps)(PrivateRoute);
export { connectedPrivateRoute as PrivateRoute }; 