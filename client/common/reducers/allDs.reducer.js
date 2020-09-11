import { allDsConstants } from '../constants';

const initialState = {};

export function allDs (state = initialState, action) {
    switch (action.type) {
        case allDsConstants.LOAD_DSLIST_REQUEST:
            return {
                dsListStatus: 'loading'
            }
        case allDsConstants.LOAD_DSLIST_SUCCESS:
            return {
                dsListStatus: 'success',
                dsList : action.dsList
            }
        case allDsConstants.LOAD_DSLIST_FAILURE:
            return {
                dsListStatus: 'fail'
            }
        case allDsConstants.SEEKING_DELETE_CONFIRM:
            let confirmObj = {};
            if ( state.deleteConfirm )
                confirmObj = state.deleteConfirm;
            confirmObj[action.dsName] = 1;
            return {
                ...state,
                deleteConfirm: confirmObj
            }
        case allDsConstants.DELETE_DS_REQUEST: 
            let deleteInProgressObj = {};
            if ( state.deleteInProgress )
                deleteInProgressObj = state.deleteInProgress;
            deleteInProgressObj[action.dsName] = 1;
            return {
                ...state,
                deleteInProgress: deleteInProgressObj
            }
        case allDsConstants.DELETE_DS_SUCCESS: 
            {
                delete state.deleteInProgress[action.dsName];
                delete state.deleteConfirm[action.dsName];
                let dbList = state.dsList.dbList;
                let prunedDbList = [];
                for (let i = 0; i < dbList.length; i++) {
                    if (dbList[i].name === action.dsName)
                        continue;
                    prunedDbList.push(dbList[i]);
                }
                state.dsList.dbList = prunedDbList;
                return {
                    ...state,
                }
            }
        default:
            return state
    }
}