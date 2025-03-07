import { dsConstants, allDsConstants } from '../constants';
import { dsService, uploadService } from '../services';


export const dsActions = {
    loadColumnsForUserView,
    clearViewDefs,
    getProjectsMetaData,
    getDefaultTypeFieldsAndValues,
    editSingleAttribute,
    insertOneDoc,
    downloadXlsx, 
    getDsList,
    getFilteredDsList,
    deleteDs,
    deleteOneDoc,
    deleteManyDocs,
    deleteColumn,
    addColumn,
    setViewDefinitions,
    refreshJira,
    addFilter,
    editFilter,
    deleteFilter, 

    clearBulkEditStore,
    uploadBulkEditXlsFile,
    setSelectedSheet,
    loadHdrsFromRange,
    doBulkEditRequest
}


function loadColumnsForUserView (dsName, dsView, dsUser) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.loadColumnsForUserView(dsName, dsView, dsUser);
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("loadColumnsForUserView failure"));
        } catch (error) {
            dispatch(failure("loadColumnsForUserView failure"));
        }
    }
    function request() { return { type: dsConstants.LOAD_COLUMNS_REQUEST, dsName, dsView, dsUser } }
    function success(columnsAndKeys) { return { type: dsConstants.LOAD_COLUMNS_SUCCESS, dsName, dsView, dsUser, columnsAndKeys } }
    function failure(message) { return { type: dsConstants.LOAD_COLUMNS_FAILURE, dsName, dsView, dsUser, message } }
}

function clearViewDefs() {
    return async dispatch => {
        dispatch({ type: dsConstants.CLEAR_VIEW_DEFS_TRACER })
    }
}

function getProjectsMetaData(dsName, dsView, dsUser) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.getProjectsMetaData({ dsName, dsView, dsUser });
            if (responseJson)
                dispatch(success(responseJson));
            else
                dispatch(failure("getProjectsMetaData failure"));
        } catch (error) {
            dispatch(failure("getProjectsMetaData failure"));
        }
    }
    function request() { return { type: dsConstants.GET_PROJECTS_METADATA_REQUEST, dsName, dsView, dsUser } }
    function success(projectsMetaData) { return { type: dsConstants.GET_PROJECTS_METADATA_SUCCESS, dsName, dsView, dsUser, projectsMetaData } }
    function failure(message) { return { type: dsConstants.GET_PROJECTS_METADATA_FAILURE, dsName, dsView, dsUser, message } }
}

function getDefaultTypeFieldsAndValues(dsName, dsView, dsUser) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.getDefaultTypeFieldsAndValues({ dsName, dsView, dsUser });
            if (responseJson)
                dispatch(success(responseJson));
            else
                dispatch(failure("getDefaultTypeFieldsAndValues failure"));
        } catch (error) {
            dispatch(failure("getDefaultTypeFieldsAndValues failure"));
        }
    }
    function request() { return { type: dsConstants.GET_DEFAULT_TYPE_FIELDS_VALUES_REQUEST, dsName, dsView, dsUser } }
    function success(defaultTypeFieldsAndValues) { return { type: dsConstants.GET_DEFAULT_TYPE_FIELDS_VALUES_SUCCESS, dsName, dsView, dsUser, defaultTypeFieldsAndValues } }
    function failure(message) { return { type: dsConstants.GET_DEFAULT_TYPE_FIELDS_VALUES_FAILURE, dsName, dsView, dsUser, message } }
}

function editSingleAttribute(dsName, dsView, dsUser, _id, column, oldVal, newVal, selectorObj, editObj, jiraConfig, jiraAgileConfig) {
    return async dispatch => {
        let editTracker = { _id, field: column, oldVal, newVal }
        try {
            //let selectorObj = {};
            //selectorObj["_id"] = _id;
            //selectorObj[column] = oldVal;
            //let editObj = {};
            //editObj[column] = newVal;
            dispatch(request(_id, editTracker));
            let responseJson = await dsService.editSingleAttribute({ dsName, dsView, dsUser, column, selectorObj, editObj, jiraConfig, jiraAgileConfig });
            if (responseJson)
                dispatch(success(_id, editTracker, responseJson));
            else 
                dispatch(failure(_id, editTracker, "loadColumnsForUserView failure"));
        } catch (error) {
            dispatch(failure(_id, editTracker, "loadColumnsForUserView failure"));
        }
    }
    function request(_id, editTracker) { return { type: dsConstants.EDIT_SINGLE_REQUEST, dsName, dsView, dsUser, _id, editTracker } }
    function success(_id, editTracker, serverStatus) { return { type: dsConstants.EDIT_SINGLE_SUCCESS, dsName, dsView, dsUser, _id, editTracker, serverStatus } }
    function failure(_id, editTracker, message) { return { type: dsConstants.EDIT_SINGLE_FAILURE, dsName, dsView, dsUser, _id, editTracker, message } }
}

function insertOneDoc (dsName, dsView, dsUser, selectorObj, doc, uiRow) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.insertOneDoc({dsName, dsView, dsUser, selectorObj, doc});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("insertOneDoc failure"));
        } catch (error) {
            dispatch(failure("insertOneDoc failure"));
        }
    }
    function request() { return { type: dsConstants.SET_ROW_ADD_TRACKER, dsName, dsView, dsUser, status: 'inserting', uiRow } }
    function success(serverStatus) { return { type: dsConstants.ROW_ADD_SUCCESS, dsName, dsView, dsUser, status: 'success', serverStatus } }
    function failure(message) { return { type: dsConstants.ROW_ADD_FAILURE, dsName, dsView, dsUser, status: 'fail', message } }
}


function downloadXlsx(dsName, dsView, dsUser, query) {
    return async dispatch => {
        try {
            dispatch(request());
            await dsService.downloadXlsx({ dsName, dsView, dsUser, query });
            dispatch(success());
        } catch (error) {
            dispatch(failure("downloadXlsx failure"));
        }
    }
    function request() { return { type: dsConstants.DOWNLOAD_XLSX_REQUEST, dsName, dsView, dsUser } }
    function success() { return { type: dsConstants.DOWNLOAD_XLSX_SUCCESS, dsName, dsView, dsUser } }
    function failure(message) { return { type: dsConstants.DOWNLOAD_XLSX_FAILURE, dsName, dsView, dsUser, message } }
}

function getDsList ( dsUser ) {
    return async dispatch => {
        try {
            dispatch(request());
            let dsList = await dsService.getDsList(dsUser);
            dispatch(success(dsList));
        } catch (error) {
            dispatch(failure("getDsList failure"));
        }
    }
    function request() { return { type: allDsConstants.LOAD_DSLIST_REQUEST, dsUser } }
    function success(dsList) { return { type: allDsConstants.LOAD_DSLIST_SUCCESS, dsList } }
    function failure(message) { return { type: allDsConstants.LOAD_DSLIST_FAILURE, message } }
}

function getFilteredDsList(dsUser, dsFilter) {
    return async dispatch => {
        try {
            dispatch(request());
            let dsList = await dsService.getFilteredDsList({ dsUser, dsFilter });
            dispatch(success(dsList));
        } catch (error) {
            dispatch(failure("getDsList failure"));
        }
    }
    function request() { return { type: allDsConstants.LOAD_DSLIST_REQUEST, dsUser } }
    function success(dsList) { return { type: allDsConstants.LOAD_DSLIST_SUCCESS, dsList } }
    function failure(message) { return { type: allDsConstants.LOAD_DSLIST_FAILURE, message } }
}

function deleteDs ( dsName, dsUser ) {
    return async dispatch => {
        try {
            dispatch(request());
            let deleteStatus = await dsService.deleteDs({ dsName, dsUser });
            dispatch(success(deleteStatus));
        } catch (error) {
            dispatch(failure("deleteDs failure"));
        }
    }
    function request() { return { type: allDsConstants.DELETE_DS_REQUEST, dsName } }
    function success(deleteStatus) { return { type: allDsConstants.DELETE_DS_SUCCESS, dsName, deleteStatus } }
    function failure(message) { return { type: allDsConstants.LOAD_DSLIST_FAILURE, dsName, message } }
}
// Redux Action: Delete Column
function deleteColumn(dsName, dsView, dsUser, columnField) {
    return async dispatch => {
        let deleteTracker = { columnField };
        
        try {
            dispatch(request(columnField, deleteTracker));

            let responseJson = await dsService.deleteColumn({
                dsName: dsName,
                dsView: dsView,
                dsUser: dsUser,
                columnName: columnField
            });

            if (responseJson && responseJson.error) {
                throw new Error(responseJson.error);
            }
            
            dispatch(success(columnField, deleteTracker, responseJson));
            dispatch(loadColumnsForUserView(dsName, dsView, dsUser));
            // alternate option to reload whole window       
            // window.location.reload();
        } catch (error) {
            console.error("Delete column failed:", error.message);
            dispatch(failure(columnField, deleteTracker, error.message));
        }
    };

    function request(columnField, deleteTracker) { 
        return { type: dsConstants.DELETE_COLUMN_REQUEST, columnField: columnField, deleteTracker: deleteTracker };
    }

    function success(columnField, deleteTracker, serverStatus) { 
        return { type: dsConstants.DELETE_COLUMN_SUCCESS, columnField: columnField, deleteTracker: deleteTracker, serverStatus: serverStatus };
    }

    function failure(columnField, deleteTracker, message) { 
        return { type: dsConstants.DELETE_COLUMN_FAILURE, columnField: columnField, deleteTracker: deleteTracker, message: message };
    }
}

function addColumn({ dsName, dsView, dsUser, columnName, position, referenceColumn, columnAttrs }) {
    return async dispatch => {
        const addTracker = `${dsName}_${columnName}`;
        dispatch(request(columnName, addTracker));
        try {
            const response = await dsService.addColumn({
                dsName,
                dsView,
                dsUser,
                columnName,
                position: position || "left", // Ensure position is not undefined
                referenceColumn,
                columnAttrs
            });

            console.log("Backend response:", response);

            if (!response) throw new Error("Server did not return a response");
            if (response.error) throw new Error({message: response.error});

            dispatch(success(columnName, addTracker, response));

            console.log("Column added successfully, fetching updated columns...");
            await dispatch(loadColumnsForUserView(dsName, dsView, dsUser));
            return response;
        } catch (error) {
            console.error("Failed to add column:", error.message);
            dispatch(failure(columnName, addTracker, error.message || "Unknown error"));
            return { error: error.message || "Unknown error" };
        }
    };

    function request(columnName, addTracker) {
        return { type: dsConstants.ADD_COLUMN_REQUEST, columnName, addTracker };
    }

    function success(columnName, addTracker, response) {
        return { type: dsConstants.ADD_COLUMN_SUCCESS, columnName, addTracker, response };
    }

    function failure(columnName, addTracker, error) {
        return { type: dsConstants.ADD_COLUMN_FAILURE, columnName, addTracker, error };
    }
}




function deleteOneDoc (dsName, dsView, dsUser, _id, row) {
    return async dispatch => {
        let deleteTracker = { _id, row }
        try {
            let selectorObj = {};
            selectorObj["_id"] = _id;
            dispatch(request(_id, deleteTracker));
            let responseJson = await dsService.deleteOneDoc({dsName, dsView, dsUser, selectorObj});
            if (responseJson)
                dispatch(success(_id, deleteTracker, responseJson));
            else 
                dispatch(failure(_id, deleteTracker, "deleteOneDoc failure"));
        } catch (error) {
            dispatch(failure(_id, deleteTracker, "deleteOneDoc failure"));
        }
    }
    function request(_id, deleteTracker) { return { type: dsConstants.DELETE_SINGLE_REQUEST, dsName, dsView, dsUser, _id, deleteTracker } }
    function success(_id, deleteTracker, serverStatus) { return { type: dsConstants.DELETE_SINGLE_SUCCESS, dsName, dsView, dsUser, _id, deleteTracker, serverStatus } }
    function failure(_id, deleteTracker, message) { return { type: dsConstants.DELETE_SINGLE_FAILURE, dsName, dsView, dsUser, _id, deleteTracker, message } }
}

function deleteManyDocs (dsName, dsView, dsUser, objects, rows) {
    return async dispatch => {
        let deleteTracker = { objects, rows }
        try {
            dispatch(request(deleteTracker));
            let responseJson = await dsService.deleteManyDocs({dsName, dsView, dsUser, objects});
            if (responseJson)
                dispatch(success(deleteTracker, responseJson));
            else 
                dispatch(failure(deleteTracker, "deleteManyDocs failure"));
        } catch (error) {
            dispatch(failure(deleteTracker, "deleteManyDocs failure"));
        }
    }
    function request(deleteTracker) { return { type: dsConstants.DELETE_MANY_REQUEST, dsName, dsView, dsUser, deleteTracker } }
    function success(deleteTracker, serverStatus) { return { type: dsConstants.DELETE_MANY_SUCCESS, dsName, dsView, dsUser, deleteTracker, serverStatus } }
    function failure(deleteTracker, message) { return { type: dsConstants.DELETE_MANY_FAILURE, dsName, dsView, dsUser, deleteTracker, message } }
}


function setViewDefinitions(dsName, dsView, dsUser, viewDefs, jiraConfig, dsDescription, otherTableAttrs, aclConfig, jiraAgileConfig, jiraProjectName, perRowAccessConfig) {
    return async dispatch => {
        try {
            dispatch(request());
            let ok, responseJson;
            if (jiraConfig && jiraAgileConfig)
                [ok, responseJson] = await dsService.setViewDefinitions({ dsName, dsView, dsUser, viewDefs, jiraConfig, dsDescription, otherTableAttrs, aclConfig, jiraAgileConfig, jiraProjectName, perRowAccessConfig });
            else if (jiraConfig)
                [ok, responseJson] = await dsService.setViewDefinitions({ dsName, dsView, dsUser, viewDefs, jiraConfig, dsDescription, otherTableAttrs, aclConfig, jiraProjectName, perRowAccessConfig });
            else if (jiraAgileConfig)
                [ok, responseJson] = await dsService.setViewDefinitions({ dsName, dsView, dsUser, viewDefs, dsDescription, otherTableAttrs, aclConfig, jiraAgileConfig, jiraProjectName, perRowAccessConfig });
            else 
                [ok, responseJson] = await dsService.setViewDefinitions({ dsName, dsView, dsUser, viewDefs, dsDescription, otherTableAttrs, aclConfig, jiraProjectName, perRowAccessConfig });
            if (ok)
                dispatch(success(responseJson));
            else 
                dispatch(failure(responseJson));
        } catch (error) {
            dispatch(failure({ status: 'fail', message: "setViewDefinitions action exception"}));
        }
    }
    function request() { return { type: dsConstants.SET_VIEW_DEFS_REQUEST, dsName, dsView, dsUser } }
    function success(serverStatus) { return { type: dsConstants.SET_VIEW_DEFS_SUCCESS, dsName, dsView, dsUser, serverStatus } }
    function failure(serverStatus) { return { type: dsConstants.SET_VIEW_DEFS_FAILURE, dsName, dsView, dsUser, serverStatus } }
}


function refreshJira (dsName, dsView, dsUser) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.refreshJira({dsName, dsView, dsUser});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("Jira refresh failure"));
        } catch (error) {
            dispatch(failure("Jira refresh failure"));
        }
    }
    function request() { return { type: dsConstants.JIRA_REFRESH_REQUEST, dsName, dsView, dsUser } }
    function success(serverStatus) { return { type: dsConstants.JIRA_REFRESH_SUCCESS, dsName, dsView, dsUser, serverStatus } }
    function failure(message) { return { type: dsConstants.JIRA_REFRESH_FAILURE, dsName, dsView, dsUser, message } }
}


function addFilter (dsName, dsView, dsUser, filter) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.addFilter({dsName, dsView, dsUser, filter});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("addFilter failure"));
        } catch (error) {
            console.log("Error:", error);
            dispatch(failure("addFilter failure"));
        }
    }
    function request() { return { type: dsConstants.ADD_FILTER_REQUEST, dsName, dsView, dsUser, status: 'inserting', filter } }
    function success(serverStatus) { return { type: dsConstants.ADD_FILTER_SUCCESS, dsName, dsView, dsUser, status: 'success', serverStatus } }
    function failure(message) { return { type: dsConstants.ADD_FILTER__FAILURE, dsName, dsView, dsUser, status: 'fail', message } }
}

function editFilter (dsName, dsView, dsUser, filter) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.editFilter({dsName, dsView, dsUser, filter});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("editFilter failure"));
        } catch (error) {
            dispatch(failure("editFilter failure"));
        }
    }
    function request() { return { type: dsConstants.EDIT_FILTER_REQUEST, dsName, dsView, dsUser, status: 'editing', filter } }
    function success(serverStatus) { return { type: dsConstants.EDIT_FILTER_SUCCESS, dsName, dsView, dsUser, status: 'success', serverStatus } }
    function failure(message) { return { type: dsConstants.EDIT_FILTER__FAILURE, dsName, dsView, dsUser, status: 'fail', message } }
}

function deleteFilter (dsName, dsView, dsUser, filter) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson = await dsService.deleteFilter({dsName, dsView, dsUser, filter});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("deleteFilter failure"));
        } catch (error) {
            dispatch(failure("deleteFilter failure"));
        }
    }
    function request() { return { type: dsConstants.DELETE_FILTER_REQUEST, dsName, dsView, dsUser, status: 'deleting', filter } }
    function success(serverStatus) { return { type: dsConstants.DELETE_FILTER_SUCCESS, dsName, dsView, dsUser, status: 'success', serverStatus } }
    function failure(message) { return { type: dsConstants.DELETE_FILTER__FAILURE, dsName, dsView, dsUser, status: 'fail', message } }
}

// For bulk-edit operations

function clearBulkEditStore () {
    return async dispatch => {
        dispatch(clear());
    };

    function clear() { return { type: dsConstants.CLEAR_DS } }
}

function uploadBulkEditXlsFile (fileName, formData) {
    return async dispatch => {
        dispatch(request(fileName));
        try {
            let responseJson = await uploadService.fileUpload(formData);
            if (responseJson)
                dispatch(success(fileName, responseJson));
            else 
                dispatch(failure("Upload failure"));
        } catch (error) {
            dispatch(failure("Uploading xls file failed"));
        }
    };

    function request(fileName) { return { type: dsConstants.UPLOAD_BULK_XLS_REQUEST, fileName } }
    function success(fileName, sheetInfo) { return { type: dsConstants.UPLOAD_BULK_XLS_SUCCESS, fileName, sheetInfo } }
    function failure(message) { return { type: dsConstants.UPLOAD_BULK_XLS_FAILURE, message } }
}

function setSelectedSheet (sheetName) {
    return async dispatch => {
        dispatch (setSheet(sheetName));
    }
    function setSheet (sheetName) { return { type: dsConstants.SET_BULK_SELECTED_SHEET, sheetName } }
}

function loadHdrsFromRange (fileName, sheetName, selectedRange) {
    return async dispatch => {
        try {
            dispatch(request(selectedRange));
            let responseJson = await uploadService.loadHdrsFromRange({fileName, sheetName, selectedRange});
            if (responseJson)
                dispatch(success(fileName, sheetName, responseJson));
            else 
                dispatch(failure("Load Data from Range failure"));
        } catch (error) {
            dispatch(failure("Load Data from Range failure"));
        }
    }
    function request(selectedRange) { return { type: dsConstants.LOAD_BULK_FROM_RANGE_REQUEST, selectedRange } }
    function success(fileName, sheetName, loadStatus) { return { type: dsConstants.LOAD_BULK_FROM_RANGE_SUCCESS, fileName, sheetName, loadStatus } }
    function failure(message) { return { type: dsConstants.LOAD_BULK_FROM_RANGE_FAILURE, message } }
}


function doBulkEditRequest(dsName, fileName, sheetName, selectedRange, setRowsFrmSheet, setColsFrmSheet, doIt, dsUser) {
    return async dispatch => {
        try {
            dispatch(request(selectedRange));
            let responseJson = await dsService.doBulkEditRequest({ dsName, fileName, sheetName, selectedRange, setRowsFrmSheet, setColsFrmSheet, doIt, dsUser });
            if (responseJson)
                dispatch(success(fileName, sheetName, responseJson));
            else 
                dispatch(failure("validate BulkEdit request failed"));
        } catch (error) {
            dispatch(failure("Validate BulkEdit request failure"));
        }
    }
    function request(selectedRange) { return { type: dsConstants.BULK_EDIT_REQUEST, selectedRange } }
    function success(fileName, sheetName, loadStatus) { return { type: dsConstants.BULK_EDIT_SUCCESS, fileName, sheetName, loadStatus } }
    function failure(message) { return { type: dsConstants.BULK_EDIT_FAILURE, message } }
}
