import { userConstants } from '../constants';
import { userService } from '../services';
import { alertActions } from './';
import { history } from '../helpers';

export const userActions = {
    login,
    logout,
    register,
    getAll,
    delete: _delete,
    sessionCheck
};

function login(username, password) {
    return /* There was no async here */ async dispatch => {
        dispatch(request({ username }));
        dispatch(alertActions.clear());
        try {
            let obj = await userService.login(username, password);
            console.log("user", obj.user);
            dispatch(success(obj.user));
            if (obj.redirectUrl) {
                console.log("redirectUrl", obj.redirectUrl);
                window.location.href = obj.redirectUrl;
            }
            //history.push('/ui');
        } catch (error) {
            //dispatch(failure(error.toString()));
            //dispatch(alertActions.error(error.toString()));
            dispatch(failure("Login incorrect: username or password is wrong"));
            dispatch(alertActions.error("Login incorrect: username or password is wrong"));
        }
    };

    function request(user) { return { type: userConstants.LOGIN_REQUEST, user } }
    function success(user) { return { type: userConstants.LOGIN_SUCCESS, user } }
    function failure(error) { return { type: userConstants.LOGIN_FAILURE, error } }
}

function logout() {
    return async dispatch => {
        try {
            let response = await userService.logout();
            if (response) {
                dispatch(userLogout());
            }
        } catch (e) {
            console.log("logging out error:", e);
        }
    }
    function userLogout() { return { type: userConstants.LOGOUT } }
}

function register(user) {
    return dispatch => {
        dispatch(request(user));

        userService.register(user)
            .then(
                user => { 
                    dispatch(success());
                    history.push('/login');
                    dispatch(alertActions.success('Registration successful'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
    function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
    function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
}

function getAll() {
    return dispatch => {
        dispatch(request());

        userService.getAll()
            .then(
                users => dispatch(success(users)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: userConstants.GETALL_REQUEST } }
    function success(users) { return { type: userConstants.GETALL_SUCCESS, users } }
    function failure(error) { return { type: userConstants.GETALL_FAILURE, error } }
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    return dispatch => {
        dispatch(request(id));

        userService.delete(id)
            .then(
                user => dispatch(success(id)),
                error => dispatch(failure(id, error.toString()))
            );
    };

    function request(id) { return { type: userConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: userConstants.DELETE_SUCCESS, id } }
    function failure(id, error) { return { type: userConstants.DELETE_FAILURE, id, error } }
}


function sessionCheck(user) {
    return async dispatch => {
        dispatch(request());
        try {
            let validSession = await userService.sessionCheck(user);
            if (validSession) {
                dispatch(success());
            } else {
                dispatch(logout());
            }
        } catch (error) {
            dispatch(failure("Login incorrect: username or password is wrong"));

        }
    };

    function request() { return { type: userConstants.SESSION_CHECK_REUEST } }
    function success() { return { type: userConstants.SESSION_CHECK_SUCCESS } }
    function failure() { return { type: userConstants.SESSION_CHECK_FAILURE } }
}