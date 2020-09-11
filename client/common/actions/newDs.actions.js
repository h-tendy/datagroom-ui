import { newDsConstants } from '../constants';
import { uploadService } from '../services';

export const newDsActions = {
    clearReduxStore,
    uploadXlsFile,
    setSelectedSheet,
    findHeadersInSheet,
    loadHdrsFromRange,
    setSelectedKeys,
    createDs
}

function clearReduxStore () {
    return async dispatch => {
        dispatch(clear());
    };

    function clear() { return { type: newDsConstants.CLEAR_DS } }
}

function uploadXlsFile (fileName, formData) {
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

    function request(fileName) { return { type: newDsConstants.UPLOAD_XLS_REQUEST, fileName } }
    function success(fileName, sheetInfo) { return { type: newDsConstants.UPLOAD_XLS_SUCCESS, fileName, sheetInfo } }
    function failure(message) { return { type: newDsConstants.UPLOAD_XLS_FAILURE, message } }
}

function setSelectedSheet (sheetName) {
    return async dispatch => {
        dispatch (setSheet(sheetName));
    }
    function setSheet (sheetName) { return { type: newDsConstants.SET_SELECTED_SHEET, sheetName } }
}

// Not used currently. 
function findHeadersInSheet (fileName, sheetName) {
    return async dispatch => {
        try {
            dispatch(request(fileName, sheetName));
            let responseJson = await uploadService.findHeadersInSheet({fileName, sheetName});
            if (responseJson)
                dispatch(success(fileName, sheetName, responseJson));
            else 
                dispatch(failure("Upload failure"));
        } catch (error) {
            dispatch(failure("Finding Hdrs failed failed"));
        }
    }
    function request() { return { type: newDsConstants.FIND_HDRS_INXLS_REQUEST } }
    function success(fileName, sheetName, hdrsInSheet) { return { type: newDsConstants.FIND_HDRS_INXLS_SUCCESS, fileName, sheetName, hdrsInSheet } }
    function failure(message) { return { type: newDsConstants.FIND_HDRS_INXLS_FAILURE, message } }
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
    function request(selectedRange) { return { type: newDsConstants.LOAD_FROM_RANGE_REQUEST, selectedRange } }
    function success(fileName, sheetName, loadStatus) { return { type: newDsConstants.LOAD_FROM_RANGE_SUCCESS, fileName, sheetName, loadStatus } }
    function failure(message) { return { type: newDsConstants.LOAD_FROM_RANGE_FAILURE, message } }
}

function setSelectedKeys (selectedKeys) {
    return async dispatch => {
        dispatch (setKeys(selectedKeys));
    }
    function setKeys (selectedKeys) { return { type: newDsConstants.SET_SELECTED_KEYS, selectedKeys } }
}

function createDs (fileName, sheetName, selectedRange, selectedKeys, dsName, dsUser) {
    return async dispatch => {
        try {
            dispatch(request(dsName));
            let responseJson = await uploadService.createDs({fileName, sheetName, selectedRange, selectedKeys, dsName, dsUser});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("Create Ds failure"));
        } catch (error) {
            dispatch(failure("Create Ds exception"));
        }
    }
    function request(dsName) { return { type: newDsConstants.CREATE_DS_REQUEST, dsName } }
    function success(createStatus) { return { type: newDsConstants.CREATE_DS_SUCCESS, fileName, sheetName, selectedRange, selectedKeys, dsName, createStatus } }
    function failure(message) { return { type: newDsConstants.CREATE_DS_FAILURE, message } }
}
