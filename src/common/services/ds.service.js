import { authHeader } from '../helpers'
const FileSaver = require('file-saver');

export const dsService = {
    loadColumnsForUserView,
    editSingleAttribute,
    insertOneDoc,
    downloadXlsx,
    getDsList,
    getFilteredDsList,
    deleteDs,
    deleteOneDoc,
    deleteManyDocs,
    setViewDefinitions,
    deleteColumn,
    addColumn,
    refreshJira,
    addFilter,
    editFilter,
    deleteFilter,
    doBulkEditRequest,
    getProjectsMetaData,
    getDefaultTypeFieldsAndValues,
    convertToJira,
    addJiraRow
};

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://in-mvlb52:8887"
    config.apiUrl = "http://localhost:8887"
} else {
    config.apiUrl = ""
}

async function loadColumnsForUserView(dsName, dsView, dsUser) {
    try {
        console.log("Starting API call: ", dsName, dsView, dsUser);
        let response = await fetch(`${config.apiUrl}/ds/view/columns/${dsName}/${dsView}/${dsUser}`, {
            method: "get",
            headers: new Headers({
                ...authHeader()
            }),
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished fetch")
        if (response.ok) {
            responseJson = await response.json();
            console.log('loadColumnsForUserView: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function editSingleAttribute(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/editSingleAttribute`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('editSingleAttribute: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function insertOneDoc(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/insertOneDoc`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('insertOneDoc: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function downloadXlsx(body) {
    let dsName = body.dsName;
    let dsUser = body.dsUser;
    let dsView = body.dsView;
    try {
        console.log("Starting API call: ", dsName, dsView, dsUser);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/downloadXlsx/${dsName}/${dsView}/${dsUser}`, {
            method: "post",
            body: JSON.stringify(body),
            headers: new Headers({
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            }),
            credentials: "include"
        });
        console.log("Finished fetch")
        if (response.ok) {
            let json = await response.json();
            if (json.output !== "") {
                let fileName = `export_${dsName}_${dsView}_${dsUser}.xlsx`;
                var fc = new Buffer(json.output, 'base64');
                let blob = new Blob([fc], { type: "binary/octet-stream" });
                FileSaver.saveAs(blob, fileName);
            } else {
                console.log('downloadXlsx: file is empty');
                throw new Error("downloadXlsx: file is empty");
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function getDsList(dsUser) {
    try {
        console.log("Starting getDsList API call: ", dsUser);
        let response = await fetch(`${config.apiUrl}/ds/dsList/${dsUser}`, {
            method: "get",
            credentials: "include",
            headers: new Headers({
                ...authHeader()
            })
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('getDsList: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function getFilteredDsList(body) {
    try {
        console.log("Starting getDsList API call: ", body.dsUser);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/dsList/${body.dsUser}`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('getDsList: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function deleteDs(body) {
    try {
        console.log("Starting deleteDs API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/deleteDs`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('deleteDs: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function deleteColumn(body) {
    try {
        console.log("Starting deleteColumn API: ", body);

        let response = await fetch(config.apiUrl + "/ds/view/deleteColumn", {
            method: "POST",
            body: JSON.stringify(body),
            headers: Object.assign({
                "Content-Type": "application/json"
            }, authHeader()),
            credentials: "include"
        });

        if (!response.ok) {
            var errorMessage = "API error: " + response.statusText;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        var responseJson = await response.json();
        console.log("deleteColumn response: ", responseJson);
        return responseJson;
    } catch (e) {
        console.error("Error in deleteColumn API: ", e);
        return { error: e.message ? e.message : "Delete operation failed" };
    }
}

async function addColumn({ dsName, dsView, dsUser, columnName, position, referenceColumn, columnAttrs = {} }) {
    try {
        position = position || "left"; // ✅ Default to "left" if undefined

        console.log("📤 Sending addColumn request:", {
            dsName, dsView, dsUser, columnName, position, referenceColumn, columnAttrs
        });

        const response = await fetch(config.apiUrl + "/ds/view/addColumn", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeader()
            },
            body: JSON.stringify({
                dsName,
                dsView,
                dsUser,
                columnName,
                position,  // ✅ Ensure position is always sent
                referenceColumn,
                columnAttrs
            }),
            credentials: "include"
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to add column.");

        return {
            ...data,
            referenceColumn,  // ✅ Ensure Redux gets referenceColumn info
            position          // ✅ Ensure Redux knows position ("left"/"right")
        };
    } catch (e) {
        console.error("🚨 Error adding column:", e);
        return { error: e.message || "Failed to add column. Please try again." };
    }
}

async function deleteOneDoc(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/deleteOneDoc`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('deleteOneDoc: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function deleteManyDocs(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/deleteManyDocs`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('deleteManyDocs: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function setViewDefinitions(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/setViewDefinitions`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('setViewDefinition: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function refreshJira(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/refreshJira`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('refreshJira: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}


async function addFilter(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/addFilter`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('addFilter: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}


async function editFilter(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/editFilter`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('editFilter: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function deleteFilter(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/deleteFilter`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('deleteFilter: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}
async function doBulkEditRequest(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/doBulkEdit`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished fetch")
        if (response.ok) {
            responseJson = await response.json();
            console.log('doBulkEditRequest: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}
async function getProjectsMetaData(body) {
    try {
        console.log("Starting getProjectsMetaData API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/getProjectsMetadataForProject`, {
            method: "post",
            mode: 'cors',
            cache: 'no-cache',
            credentials: "include",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            }
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('projectsMetaData: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function getDefaultTypeFieldsAndValues(body) {
    try {
        console.log("Starting getDefaultTypeFieldsAndValues API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/getDefaultTypeFieldsAndValues`, {
            method: "post",
            mode: 'cors',
            cache: 'no-cache',
            credentials: "include",
            body: JSON.stringify(body),
            headers: new Headers(
                {
                    "Content-Type": "application/json",
                    "Content-Length": dataLen,
                    ...authHeader()
                }
            )
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('getDefaultTypeFieldsAndValues: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function convertToJira(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/convertToJira`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('convertToJira: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}

async function addJiraRow(body) {
    try {
        console.log("Starting API call: ", body);
        let dataLen = JSON.stringify(body).length.toString();
        let response = await fetch(`${config.apiUrl}/ds/view/addJiraRow`, {
            method: "post",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Content-Length": dataLen,
                ...authHeader()
            },
            credentials: "include"
        });
        let responseJson = null;
        console.log("Finished API")
        if (response.ok) {
            responseJson = await response.json();
            console.log('addJiraRow: ', responseJson);
        }
        return responseJson;
    } catch (e) {
        console.log(e);
    }
}
