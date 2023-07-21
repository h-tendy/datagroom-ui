import { userConstants } from '../constants';

let user = JSON.parse(localStorage.getItem('user'));
const initialState = user ? { loggedIn: false, user } : {};

export function authentication(state = initialState, action) {
  switch (action.type) {
    case userConstants.LOGIN_REQUEST:
      return {
        loggingIn: true,
        user: action.user
      };
    case userConstants.LOGIN_SUCCESS:
      return {
        loggedIn: true,
        user: action.user
      };
    case userConstants.LOGIN_FAILURE:
      return {};
    case userConstants.LOGOUT:
      return {};
    case userConstants.SESSION_CHECK_REUEST:
      return {
        ...initialState,
        loggingIn: true,
      }
    case userConstants.SESSION_CHECK_SUCCESS:
      return {
        ...initialState,
        loggedIn: true,
      }
    case userConstants.SESSION_CHECK_FAILURE:
      return {}
    default:
      return state
  }
}