import { dsConstants } from '../constants';

const initialState = {
};

export function dsHome (state = initialState, action) {
    switch (action.type) {
        case dsConstants.LOAD_COLUMNS_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsViews)
                    newState.dsViews = {};
                newState.dsViews[action.dsView] = { status: 'loading' };
                return newState
            }
        case dsConstants.LOAD_COLUMNS_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsViews)
                    newState.dsViews = {};
                newState.dsViews[action.dsView] = { status: 'success', columns: action.columnsAndKeys.columns, columnAttrs: action.columnsAndKeys.columnAttrs, keys: action.columnsAndKeys.keys, jiraConfig: action.columnsAndKeys.jiraConfig, dsDescription: action.columnsAndKeys.dsDescription, filters: action.columnsAndKeys.filters, otherTableAttrs: action.columnsAndKeys.otherTableAttrs, aclConfig: action.columnsAndKeys.aclConfig, jiraAgileConfig: action.columnsAndKeys.jiraAgileConfig, jiraProjectName: action.columnsAndKeys.jiraProjectName };
                return newState
            }
        case dsConstants.LOAD_COLUMNS_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsViews)
                    newState.dsViews = {};
                newState.dsViews[action.dsView] = { status: 'fail', error: action.message };
                return newState
            }
            // Column Reducers:
            case dsConstants.DELETE_COLUMN_REQUEST: {
                let newState = { ...state };
                let columnField = action.columnField;
            
                // Initialize the delete tracker for the column
                newState.dsColumnDeletes = {
                    ...state.dsColumnDeletes,
                    [columnField]: { deleteStatus: 'pending' }
                };
            
                return newState;
            }

            case dsConstants.DELETE_COLUMN_SUCCESS: {
                let newState = { ...state };
                let columnField = action.columnField;
            
                // Ensure `columns` and `columnAttrs` are properly initialized
                let columnsArray = state.columns ? state.columns.slice() : [];
                let columnAttrsArray = state.columnAttrs ? state.columnAttrs.slice() : [];
            
                // Remove deleted column
                newState.columns = columnsArray.filter(col => col !== columnField);
                newState.columnAttrs = columnAttrsArray.filter(attr => attr.field !== columnField);
            
                // Update delete tracker
                newState.dsColumnDeletes = { 
                    ...state.dsColumnDeletes, 
                    [columnField]: { deleteStatus: 'done', serverStatus: action.serverStatus } 
                };
            
                return newState;
            }
            
            case dsConstants.DELETE_COLUMN_FAILURE: {
                return {
                    ...state,
                    dsColumnDeletes: {
                        ...state.dsColumnDeletes,
                        [action.columnField]: { deleteStatus: 'fail', error: action.error }
                    }
                };
            }
            case dsConstants.CLEAR_DELETE_COLUMN_TRACKER: {
                let newState = { ...state };
                let columnField = action.columnField;
            
                // Clear the delete tracker for the column
                if (newState.dsColumnDeletes[columnField]) {
                    delete newState.dsColumnDeletes[columnField];
                }
            
                return newState;
            }

            case dsConstants.ADD_COLUMN_REQUEST: {
                let newState = { ...state };
                let columnField = action.columnField;
            
                // Initialize the add tracker for the column
                newState.dsColumnAdds = {
                    ...state.dsColumnAdds,
                    [columnField]: { addStatus: 'pending' }
                };
            
                return newState;
            }
            
            case dsConstants.ADD_COLUMN_SUCCESS: {
                let newState = { ...state };
                let columnField = action.columnName; 
                let referenceColumn = action.response.referenceColumn;
                let position = action.response.position; 
            
                let columnsArray = state.columns ? [...state.columns] : [];
                let columnAttrsArray = state.columnAttrs ? [...state.columnAttrs] : [];
            
                if (!columnsArray.includes(columnField)) {
                    let index = columnsArray.indexOf(referenceColumn);
            
                    if (index !== -1) {
                        if (position === "left") {
                            columnsArray.splice(index, 0, columnField);
                        } else if (position === "right") {
                            columnsArray.splice(index + 1, 0, columnField);
                        }
                    } else {
                        columnsArray.push(columnField); // ✅ Fallback if reference column is missing
                    }
                }
            
                if (!columnAttrsArray.some(attr => attr.field === columnField)) {
                    columnAttrsArray.push({ field: columnField });
                }
            
                newState.columns = columnsArray;
                newState.columnAttrs = columnAttrsArray;
            
                newState.dsColumnAdds = { 
                    ...state.dsColumnAdds, 
                    [columnField]: { addStatus: 'done', serverStatus: action.serverStatus } 
                };
            
                console.log("✅ Redux State Updated Correctly:", newState);
                return newState;
            }
            
            case dsConstants.ADD_COLUMN_FAILURE: {
                return {
                    ...state,
                    dsColumnAdds: {
                        ...state.dsColumnAdds,
                        [action.columnField]: { addStatus: 'fail', error: action.message }
                    }
                };
            }
            
            case dsConstants.CLEAR_COLUMN_ADD_TRACKER: {
                let newState = { ...state };
                let columnField = action.columnField;
            
                // Clear the add tracker for the column
                if (newState.dsColumnAdds[columnField]) {
                    delete newState.dsColumnAdds[columnField];
                }
            
                return newState;
            }
            
                      
        case dsConstants.GET_DEFAULT_TYPE_FIELDS_VALUES_REQUEST:
            {
                let newState = { ...state };
                if (!newState.defaultTypeFieldsAndValues)
                    newState.defaultTypeFieldsAndValues = {};
                newState.defaultTypeFieldsAndValues = { status: 'loading' };
                return newState
            }
        case dsConstants.GET_DEFAULT_TYPE_FIELDS_VALUES_SUCCESS:
            {
                let newState = { ...state };
                if (!newState.defaultTypeFieldsAndValues)
                    newState.defaultTypeFieldsAndValues = {};
                newState.defaultTypeFieldsAndValues = { status: 'success', value: action.defaultTypeFieldsAndValues };
                return newState
            }
        case dsConstants.GET_DEFAULT_TYPE_FIELDS_VALUES_FAILURE:
            {
                let newState = { ...state };
                if (!newState.defaultTypeFieldsAndValues)
                    newState.defaultTypeFieldsAndValues = {};
                newState.defaultTypeFieldsAndValues = { status: 'fail', error: action.message };
                return newState
            }

        case dsConstants.EDIT_SINGLE_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsEdits)
                    newState.dsEdits = {};
                newState.dsEdits[action._id] = { editStatus: 'editing', editTracker: action.editTracker };
                return newState
            }
        case dsConstants.EDIT_SINGLE_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsEdits)
                    newState.dsEdits = {};
                newState.dsEdits[action._id] = { editStatus: 'done', serverStatus: action.serverStatus, editTracker: action.editTracker };
                return newState
            }
        case dsConstants.EDIT_SINGLE_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsEdits)
                    newState.dsEdits = {};
                newState.dsEdits[action._id] = { editStatus: 'fail', editTracker: action.editTracker, error: action.message };
                return newState
            }
        case dsConstants.EDIT_SINGLE_DELETE_TRACKER:
            {
                let newState = {...state};
                if (!newState.dsEdits)
                    newState.dsEdits = {};
                delete newState.dsEdits[action._id];
                return newState
            }
        case dsConstants.CLEAR_COLUMNS:
            return {};
        case dsConstants.SET_ROW_ADD_TRACKER: 
            {
                let newState = {...state};
                if (!newState.dsRowAdds)
                    newState.dsRowAdds = {};
                newState.dsRowAdds[action.dsView] = { ...newState.dsRowAdds[action.dsView], status: action.status, uiRow: action.uiRow };
                return newState
            }
        case dsConstants.ROW_ADD_SUCCESS: 
            {
                let newState = {...state};
                if (!newState.dsRowAdds)
                    newState.dsRowAdds = {};
                newState.dsRowAdds[action.dsView] = { ...newState.dsRowAdds[action.dsView], status: action.status, serverStatus: action.serverStatus };
                return newState
            }
        case dsConstants.ROW_ADD_FAILURE: 
            {
                let newState = {...state};
                if (!newState.dsRowAdds)
                    newState.dsRowAdds = {};
                newState.dsRowAdds[action.dsView] = { ...newState.dsRowAdds[action.dsView], status: action.status, error: action.message };
                return newState
            }
        case dsConstants.CLEAR_ROW_ADD_TRACKER: 
            {
                delete state.dsRowAdds;
                return state;
            }
        case dsConstants.DELETE_SINGLE_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                newState.dsDeletes[action._id] = { deleteStatus: 'deleting', deleteTracker: action.deleteTracker };
                return newState
            }
        case dsConstants.DELETE_SINGLE_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                newState.dsDeletes[action._id] = { deleteStatus: 'done', serverStatus: action.serverStatus, deleteTracker: action.deleteTracker };
                return newState
            }
        case dsConstants.DELETE_SINGLE_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                newState.dsDeletes[action._id] = { deleteStatus: 'fail', deleteTracker: action.deleteTracker, error: action.message };
                return newState
            }
        case dsConstants.DELETE_SINGLE_DELETE_TRACKER:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                delete newState.dsDeletes[action._id];
                return newState
            }
        case dsConstants.SET_VIEW_DEFS_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsSetView)
                    newState.dsSetView = {};
                newState.dsSetView.dsName = action.dsName;
                newState.dsSetView.dsView = action.dsView;
                newState.dsSetView.status = "setting";
                return newState
            }
        case dsConstants.SET_VIEW_DEFS_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsSetView)
                    newState.dsSetView = {};
                newState.dsSetView.dsName = action.dsName;
                newState.dsSetView.dsView = action.dsView;
                newState.dsSetView.status = "success";
                newState.dsSetView.serverStatus = action.serverStatus;
                return newState
            }
        case dsConstants.SET_VIEW_DEFS_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsSetView)
                    newState.dsSetView = {};
                newState.dsSetView.dsName = action.dsName;
                newState.dsSetView.dsView = action.dsView;
                newState.dsSetView.status = "fail";
                newState.dsSetView.message = action.message;
                return newState
            }
        case dsConstants.CLEAR_VIEW_DEFS_TRACER:
            {
                let newState = {...state};
                delete newState.dsSetView;
                return newState
            }                        
        case dsConstants.JIRA_REFRESH_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsJiraRefresh)
                    newState.dsJiraRefresh = {};
                newState.dsJiraRefresh.dsName = action.dsName;
                newState.dsJiraRefresh.dsView = action.dsView;
                newState.dsJiraRefresh.status = 'refreshing';
                return newState
            }
        case dsConstants.JIRA_REFRESH_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsJiraRefresh)
                    newState.dsJiraRefresh = {};
                newState.dsJiraRefresh.dsName = action.dsName;
                newState.dsJiraRefresh.dsView = action.dsView;
                newState.dsJiraRefresh.status = 'done';
                newState.dsJiraRefresh.serverStatus = action.serverStatus;
                return newState
            }
        case dsConstants.JIRA_REFRESH_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsJiraRefresh)
                    newState.dsJiraRefresh = {};
                newState.dsJiraRefresh.dsName = action.dsName;
                newState.dsJiraRefresh.dsView = action.dsView;
                newState.dsJiraRefresh.status = 'fail';
                newState.dsJiraRefresh.message = action.message;
                return newState
            }
        case dsConstants.JIRA_REFRESH_DELETE_TRACKER:
            {
                let newState = {...state};
                if (!newState.dsJiraRefresh)
                    newState.dsJiraRefresh = {};
                newState.dsJiraRefresh.status = 'dusted';
                return newState
            }
        case dsConstants.DELETE_MANY_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                newState.dsDeletes["__dg__DELETE_MANY"] = { deleteStatus: 'deleting', deleteTracker: action.deleteTracker };
                return newState
            }
        case dsConstants.DELETE_MANY_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                newState.dsDeletes["__dg__DELETE_MANY"] = { deleteStatus: 'done', serverStatus: action.serverStatus, deleteTracker: action.deleteTracker };
                return newState
            }
        case dsConstants.DELETE_MANY_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                newState.dsDeletes["__dg__DELETE_MANY"] = { deleteStatus: 'fail', deleteTracker: action.deleteTracker, error: action.message };
                return newState
            }
        case dsConstants.DELETE_MANY_DELETE_TRACKER:
            {
                let newState = {...state};
                if (!newState.dsDeletes)
                    newState.dsDeletes = {};
                delete newState.dsDeletes["__dg__DELETE_MANY"];
                return newState
            }
        case dsConstants.ADD_FILTER_REQUEST: 
            {
                let newState = {...state};
                if (!newState.dsFilterAdds)
                    newState.dsFilterAdds = {};
                newState.dsFilterAdds[action.dsView] = { ...newState.dsFilterAdds[action.dsView], status: action.status, filter: action.filter };
                return newState
            }
        case dsConstants.ADD_FILTER_SUCCESS: 
            {
                let newState = {...state};
                if (!newState.dsFilterAdds)
                    newState.dsFilterAdds = {};
                newState.dsFilterAdds[action.dsView] = { ...newState.dsFilterAdds[action.dsView], status: action.status, serverStatus: action.serverStatus };
                return newState
            }
        case dsConstants.ADD_FILTER__FAILURE: 
            {
                let newState = {...state};
                if (!newState.dsFilterAdds)
                    newState.dsFilterAdds = {};
                newState.dsFilterAdds[action.dsView] = { ...newState.dsFilterAdds[action.dsView], status: action.status, error: action.message };
                return newState
            }            
        case dsConstants.CLEAR_ADD_FILTER_TRACKER:
            {
                let newState = {...state};
                delete newState.dsFilterAdds;
                return newState
            }    
        case dsConstants.EDIT_FILTER_REQUEST: 
            {
                let newState = {...state};
                if (!newState.dsFilterEdits)
                    newState.dsFilterEdits = {};
                newState.dsFilterEdits[action.dsView] = { ...newState.dsFilterEdits[action.dsView], status: action.status, filter: action.filter };
                return newState
            }
        case dsConstants.EDIT_FILTER_SUCCESS: 
            {
                let newState = {...state};
                if (!newState.dsFilterEdits)
                    newState.dsFilterEdits = {};
                newState.dsFilterEdits[action.dsView] = { ...newState.dsFilterEdits[action.dsView], status: action.status, serverStatus: action.serverStatus };
                return newState
            }
        case dsConstants.EDIT_FILTER__FAILURE: 
            {
                let newState = {...state};
                if (!newState.dsFilterEdits)
                    newState.dsFilterEdits = {};
                newState.dsFilterEdits[action.dsView] = { ...newState.dsFilterEdits[action.dsView], status: action.status, error: action.message };
                return newState
            }            
        case dsConstants.CLEAR_EDIT_FILTER_TRACKER:
            {
                let newState = {...state};
                delete newState.dsFilterEdits;
                return newState
            }

        case dsConstants.DELETE_FILTER_REQUEST: 
            {
                let newState = {...state};
                if (!newState.dsFilterDeletes)
                    newState.dsFilterDeletes = {};
                newState.dsFilterDeletes[action.dsView] = { ...newState.dsFilterDeletes[action.dsView], status: action.status, filter: action.filter };
                return newState
            }
        case dsConstants.DELETE_FILTER_SUCCESS: 
            {
                let newState = {...state};
                if (!newState.dsFilterDeletes)
                    newState.dsFilterDeletes = {};
                newState.dsFilterDeletes[action.dsView] = { ...newState.dsFilterDeletes[action.dsView], status: action.status, serverStatus: action.serverStatus };
                return newState
            }
        case dsConstants.DELETE_FILTER__FAILURE: 
            {
                let newState = {...state};
                if (!newState.dsFilterDeletes)
                    newState.dsFilterDeletes = {};
                newState.dsFilterDeletes[action.dsView] = { ...newState.dsFilterDeletes[action.dsView], status: action.status, error: action.message };
                return newState
            }            
        case dsConstants.CLEAR_DELETE_FILTER_TRACKER:
            {
                let newState = {...state};
                delete newState.dsFilterDeletes;
                return newState
            }
 
        case dsConstants.CLEAR_DS:
            {
                let newState = {...state};
                delete newState.dsBulkEdits;
                return newState
            }
        case dsConstants.UPLOAD_BULK_XLS_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.uploadStatus = 'uploading';
                newState.dsBulkEdits.fileName = action.fileName
                return newState;
            }
        case dsConstants.UPLOAD_BULK_XLS_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.uploadStatus = 'success';
                newState.dsBulkEdits.fileName = action.fileName;
                newState.dsBulkEdits.sheetInfo = action.sheetInfo;
                return newState;
            }
        case dsConstants.UPLOAD_BULK_XLS_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.uploadStatus = 'fail';
                newState.dsBulkEdits.uploadError = action.message;
                return newState;
            }
        case dsConstants.SET_BULK_SELECTED_SHEET:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.selectedSheet = action.sheetName;
                return newState;
            }
        case dsConstants.BULK_EDIT_REQUEST:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.selectedRange = action.selectedRange;
                return newState;
            }
        case dsConstants.BULK_EDIT_SUCCESS:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.loadStatus = action.loadStatus;
                return newState;
            }
        case dsConstants.BULK_EDIT_FAILURE:
            {
                let newState = {...state};
                if (!newState.dsBulkEdits)
                    newState.dsBulkEdits = {};
                newState.dsBulkEdits.loadStatus = action.loadStatus;
                return newState;
            }
        case dsConstants.CLEAR_LOADSTATUS:
            {
                let newState = {...state};
                delete newState.dsBulkEdits.loadStatus;
                return newState
            }


        default:
            return state
    }
}