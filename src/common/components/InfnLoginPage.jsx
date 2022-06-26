import React from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { withRouter } from "react-router-dom";

//import "./login.css"; // Don't do it here, see note below. 

import { userActions } from '../actions';

class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            submitted: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e) {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    }

    handleSubmit(e) {
        e.preventDefault();
        this.setState({ submitted: true });
        let { username, password } = this.state;
        const { dispatch } = this.props;
        if (username && password) {
            let m = username.match(/(.*?)@(.*)/);
            if (m && (m.length >= 2)) {
                username = m[1];
            }        
            dispatch(userActions.login(username, password));
        }
    }

    render() {
        const { loggingIn, loggedIn, message } = this.props;
        const { username, password, submitted } = this.state;

        const { from } = this.props.location.state || { from: { pathname: "/" } };
    
        if (loggedIn) {
            return <Redirect to={from} />;
        }
        require('./login.css');
        return (
            <div>
                <div className="logincontainer">
                    <section id="content">
                        <h10>Welcome to Datagroom</h10>
                        <br/><br/><br/>
                        <form name="form" onSubmit={this.handleSubmit}>
                            <div>
                                <input type="text" name="username" id="username" placeholder="username" value={username} onChange={this.handleChange} />
                                {submitted && !username &&
                                    <div className="help-block">Username is required</div>
                                }
                                <br />
                            </div>
                            <div>
                                <input type="password" name="password" id="password" placeholder="password" value={password} onChange={this.handleChange} autocomplete="current-password" />
                                {submitted && !password &&
                                    <div className="help-block">Password is required</div>
                                }
                                <br />
                            </div>
                            
                            <div className="form-group">
                                <button>Log In</button>
                                {/*<input type="submit" value="Log In" />*/}
                                {loggingIn &&
                                    <div style={{float: 'left'}}>
                                    <img src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==" alt="Waiting"/>
                                    </div>
                                }
                                {submitted && message &&
                                    <div className="help-block">{message}</div>
                                }
                                <div><br/><br/></div>
                            </div>

                        </form>
                    </section>
                    <div>
                            <br/>
                            <div className="clearfix"></div>                
                    </div>
                    <p style={{clear:"both"}}></p><br/>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    const { loggingIn, loggedIn } = state.authentication;
    const { type, message } = state.alert;
    return {
        loggingIn,
        loggedIn,
        type,
        message
    }
}

const connectedLoginPage = withRouter(connect(mapStateToProps)(LoginPage));
export { connectedLoginPage as LoginPage }; 