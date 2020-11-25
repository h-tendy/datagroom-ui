import { newDsConstants } from '../constants';

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
            createStatus: action.createStatus
        }
    case newDsConstants.CREATE_DS_FAILURE:
        return {
            ...state,
            createStatus: { status: 'fail', error: action.message }
        }
    
    default:
      return state
  }
}