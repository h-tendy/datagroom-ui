import React from "react";
//import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Router, Route, Switch } from "react-router-dom";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import App from "./App";
import { LoginPage } from "./InfnLoginPage";
import { PrivateRoute } from "./PrivateRoute";
import { history } from '../helpers';


const Root = ({ store }) => (
    <Provider store={store}>
        <Router history={history}>
            <div>
                <Switch>
                    <Route path="/login" component={LoginPage}/>
                    <PrivateRoute path="/*" component={App} />
                </Switch>
            </div>
        </Router>
    </Provider>
);

Root.propTypes = {
    store: PropTypes.oneOfType([
        PropTypes.func.isRequired,
        PropTypes.object.isRequired,
    ]).isRequired,
};


export default Root;