import { dsConstants, allDsConstants } from '../constants';
import { dsService } from '../services';

export const dsActions = {
    loadColumnsForUserView,
    editSingleAttribute,
    insertOneDoc,
    downloadXlsx, 
    getDsList,
    deleteDs,
    deleteOneDoc,
    setViewDefinitions,
    refreshJira
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

function editSingleAttribute (dsName, dsView, dsUser, _id, column, oldVal, newVal, selectorObj, editObj) {
    return async dispatch => {
        let editTracker = { _id, field: column, oldVal, newVal }
        try {
            //let selectorObj = {};
            //selectorObj["_id"] = _id;
            //selectorObj[column] = oldVal;
            //let editObj = {};
            //editObj[column] = newVal;
            dispatch(request(_id, editTracker));
            let responseJson = await dsService.editSingleAttribute({dsName, dsView, dsUser, column, selectorObj, editObj});
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


function downloadXlsx (dsName, dsView, dsUser) {
    return async dispatch => {
        try {
            dispatch(request());
            await dsService.downloadXlsx(dsName, dsView, dsUser);
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


function setViewDefinitions (dsName, dsView, dsUser, viewDefs, jiraConfig, dsDescription) {
    return async dispatch => {
        try {
            dispatch(request());
            let responseJson;
            if (jiraConfig)
                responseJson = await dsService.setViewDefinitions({dsName, dsView, dsUser, viewDefs, jiraConfig, dsDescription});
            else 
                responseJson = await dsService.setViewDefinitions({dsName, dsView, dsUser, viewDefs});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("setViewDefinitions failure"));
        } catch (error) {
            dispatch(failure("setViewDefinitions failure"));
        }
    }
    function request() { return { type: dsConstants.SET_VIEW_DEFS_REQUEST, dsName, dsView, dsUser } }
    function success(serverStatus) { return { type: dsConstants.SET_VIEW_DEFS_SUCCESS, dsName, dsView, dsUser, serverStatus } }
    function failure(message) { return { type: dsConstants.SET_VIEW_DEFS_FAILURE, dsName, dsView, dsUser, message } }
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
