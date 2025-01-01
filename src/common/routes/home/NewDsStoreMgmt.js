// @ts-check
import { uploadService } from '../../services';

// Constants section

export const newDsConstants = {
    CLEAR_DS: 'CLEAR_DS',
    UPLOAD_XLS_REQUEST: 'UPLOAD_XLS_REQUEST', 
    UPLOAD_XLS_SUCCESS: 'UPLOAD_XLS_SUCCESS',
    UPLOAD_XLS_FAILURE: 'UPLOAD_XLS_FAILURE',

    UPLOAD_CSV_REQUEST: 'UPLOAD_CSV_REQUEST', 
    UPLOAD_CSV_SUCCESS: 'UPLOAD_CSV_SUCCESS',
    UPLOAD_CSV_FAILURE: 'UPLOAD_CSV_FAILURE',

    SET_SELECTED_SHEET: 'SET_SELECTED_SHEET',
    SET_SELECTED_KEYS: 'SET_SELECTED_KEYS', 
    FIND_HDRS_INXLS_REQUEST: 'FIND_HDRS_INXLS_REQUEST',
    FIND_HDRS_INXLS_SUCCESS: 'FIND_HDRS_INXLS_SUCCESS',
    FIND_HDRS_INXLS_FAILURE: 'FIND_HDRS_INXLS_FAILURE',

    LOAD_FROM_RANGE_REQUEST: 'LOAD_FROM_RANGE_REQUEST',
    LOAD_FROM_RANGE_SUCCESS: 'LOAD_FROM_RANGE_SUCCESS',
    LOAD_FROM_RANGE_FAILURE: 'LOAD_FROM_RANGE_FAILURE',

    CREATE_DS_REQUEST: 'CREATE_DS_REQUEST',
    CREATE_DS_SUCCESS: 'CREATE_DS_SUCCESS',
    CREATE_DS_FAILURE: 'CREATE_DS_FAILURE'
};


// Reducer section

const initialState = {};

export function newDs(state = initialState, action) {
  switch (action.type) {
    case newDsConstants.CLEAR_DS:
        return { };
    case newDsConstants.UPLOAD_XLS_REQUEST:
    case newDsConstants.UPLOAD_CSV_REQUEST:
        return {
            uploadStatus: 'uploading',
            fileName: action.fileName
        };
    case newDsConstants.UPLOAD_XLS_SUCCESS:
        return {
            uploadStatus: 'success',
            fileName: action.fileName,
            sheetInfo: action.sheetInfo
        };
    case newDsConstants.UPLOAD_CSV_SUCCESS:
        return {
            uploadStatus: 'success',
            fileName: action.fileName,
            hdrs: action.hdrs
        };
        
    case newDsConstants.UPLOAD_XLS_FAILURE:
    case newDsConstants.UPLOAD_CSV_FAILURE:
        return {
            uploadStatus: 'fail',
            uploadError: action.message
        };
    case newDsConstants.SET_SELECTED_SHEET:
        return {
            ...state,
            selectedSheet: action.sheetName
        }
    case newDsConstants.LOAD_FROM_RANGE_REQUEST:
        return {
            ...state,
            selectedRange: action.selectedRange
        }
    case newDsConstants.LOAD_FROM_RANGE_SUCCESS:
        return {
            ...state,
            loadStatus: action.loadStatus
        }
    case newDsConstants.LOAD_FROM_RANGE_FAILURE:
        return {
            ...state,
            loadStatus: action.loadStatus,
        }
    case newDsConstants.SET_SELECTED_KEYS:
        return {
            ...state,
            selectedKeys: action.selectedKeys
        }
    case newDsConstants.CREATE_DS_REQUEST:
        return {
            ...state,
            dsName: action.dsName
        }
    case newDsConstants.CREATE_DS_SUCCESS:
        return {
            ...state,
            status: 'success',
            serverStatus: action.serverStatus
        }
    case newDsConstants.CREATE_DS_FAILURE:
        return {
            ...state,
            status: 'fail',
            serverStatus: action.serverStatus,
        }
    
    default:
      return state
  }
}



// Actions section 

export const newDsActions = {
    clearReduxStore,
    uploadXlsFile,
    setSelectedSheet,
    findHeadersInSheet,
    loadHdrsFromRange,
    setSelectedKeys,
    createDs,
    uploadCsvFile,
    createDsViaCsv,
    createDsFromDs
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
            dispatch(request());
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



function uploadCsvFile (fileName, formData) {
    return async dispatch => {
        dispatch(request(fileName));
        try {
            let responseJson = await uploadService.csvFileUpload(formData);
            if (responseJson)
                dispatch(success(fileName, responseJson));
            else 
                dispatch(failure("Upload failure"));
        } catch (error) {
            dispatch(failure("Uploading csv file failed"));
        }
    };

    function request(fileName) { return { type: newDsConstants.UPLOAD_CSV_REQUEST, fileName } }
    function success(fileName, hdrs) { return { type: newDsConstants.UPLOAD_CSV_SUCCESS, fileName, hdrs } }
    function failure(message) { return { type: newDsConstants.UPLOAD_CSV_FAILURE, message } }
}

function createDsViaCsv (fileName, selectedKeys, dsName, dsUser) {
    return async dispatch => {
        try {
            dispatch(request(dsName));
            let responseJson = await uploadService.createDsViaCsv({fileName, selectedKeys, dsName, dsUser});
            if (responseJson)
                dispatch(success(responseJson));
            else 
                dispatch(failure("Create Ds failure"));
        } catch (error) {
            dispatch(failure("Create Ds exception"));
        }
    }
    function request(dsName) { return { type: newDsConstants.CREATE_DS_REQUEST, dsName } }
    function success(createStatus) { return { type: newDsConstants.CREATE_DS_SUCCESS, fileName, selectedKeys, dsName, createStatus } }
    function failure(message) { return { type: newDsConstants.CREATE_DS_FAILURE, message } }
}


function createDsFromDs (fromDsName, toDsName, dsUser, retainData) {
    return async dispatch => {
        try {
            dispatch(request(toDsName));
            let ok, responseJson;
            [ok, responseJson] = await uploadService.createDsFromDs({fromDsName, toDsName, dsUser, retainData});
            if (ok)
                dispatch(success(responseJson));
            else
                dispatch(failure(responseJson));
        } catch (error) {
            dispatch(failure({ status: 'fail', message: "createDsFromDs action exception"}));
        }
    }
    function request(dsName) { return { type: newDsConstants.CREATE_DS_REQUEST, dsName } }
    function success(serverStatus) { return { type: newDsConstants.CREATE_DS_SUCCESS, fromDsName, toDsName, serverStatus } }
    function failure(serverStatus) { return { type: newDsConstants.CREATE_DS_FAILURE, serverStatus } }
}
