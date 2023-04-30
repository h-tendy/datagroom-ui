import { authHeader } from '../helpers';

export const userService = {
    login,
    logout,
    register,
    getAll,
    getById,
    update,
    delete: _delete,
    sessionCheck
};

const config = {};
if(process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl= ""
}


function login(username, password) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: "include"
    };

    return fetch(`${config.apiUrl}/login`, requestOptions)
        .then(handleResponse)
        .then(user => {
            // login successful if there's a jwt token in the response
            if (user.token) {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(user));
            }

            return user;
        });
}

async function logout() {
    // remove user from local storage to log user out
    try {
        console.log("logging out...");
        let response = await fetch(`${config.apiUrl}/logout`, {
            method: "GET",
            credentials: "include"
        });
        if (response.ok) {
            localStorage.removeItem('user');
        }
    } catch (e) {
        console.log("Error in logging out:", e)
    }
}

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader(),
        credentials: "include"
    };

    return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader(),
        credentials: "include"
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function register(user) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        credentials: "include"
    };

    return fetch(`${config.apiUrl}/users/register`, requestOptions).then(handleResponse);
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        credentials: "include"
    };

    return fetch(`${config.apiUrl}/users/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader(),
        credentials: "include"
    };

    return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                // XXX: react complains here
                //location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }
        return JSON.parse(data.user);
    });
}

async function sessionCheck(user) {
    let response;
    try {
        let url = `${config.apiUrl}/sessionCheck`;
        response = await fetch(url, {
            method: "get",
            headers: {
                ...authHeader(),
                "Content-Type": "application/json",
                "user": user.user
            },
            credentials: 'include'
        });
        if (response.ok) {
            return true;
        } else {
            console.log("Response not ok in sessionCheck!", response);
            throw new Error("Response not ok in sessiosCheck!");
        }
    } catch (e) {
        console.log("sessionCheck! has errors!", e);
    }
    return false;
}