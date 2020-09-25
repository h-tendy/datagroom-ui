export const uploadService = {
    fileUpload,
    findHeadersInSheet,
    loadHdrsFromRange,
    createDs
};

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}


async function fileUpload(body) {
    try {
        const requestOptions = {
            method: 'POST',
            body
        };
        let responseJson = null;
        let response = await fetch(`${config.apiUrl}/upload`, requestOptions);
        if (response.ok) {
            responseJson = await response.json();
            console.log('uploaded', responseJson);
        }
        console.log(response);
        return responseJson;
    } catch(e) {
        console.log(e);
    }
}

async function findHeadersInSheet(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/upload/findHeadersInSheet`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
            }     
        });
        let responseJson = null;
        console.log("Finished fetch")
        if (response.ok) {
            responseJson = await response.json();
            console.log('findHeadersInSheet', responseJson);
        }
        console.log(response);
        return responseJson;
    } catch(e) {
        console.log(e);
    }
}

async function loadHdrsFromRange (body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/upload/loadHdrsFromRange`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
            }     
        });
        let responseJson = null;
        console.log("Finished fetch")
        if (response.ok) {
            responseJson = await response.json();
            console.log('loadHdrsFromRange: ', responseJson);
        }
        return responseJson;
    } catch(e) {
        console.log(e);
    }
}

async function createDs (body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/upload/createDs`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
            }     
        });
        let responseJson = null;
        console.log("Finished fetch")
        if (response.ok) {
            responseJson = await response.json();
            console.log('createDs ', responseJson);
        }
        return responseJson;
    } catch(e) {
        console.log(e);
    }
}