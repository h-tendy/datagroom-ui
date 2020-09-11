import { combineReducers } from 'redux';

import { authentication } from './authentication.reducer';
import { registration } from './registration.reducer';
import { users } from './users.reducer';
import { alert } from './alert.reducer';
import { newDs } from './newDs.reducer';
import { dsHome } from './dsHome.reducer';
import { allDs } from './allDs.reducer';

const rootReducer = combineReducers({
  authentication,
  registration,
  users,
  alert,
  allDs,
  newDs,
  dsHome
});

export default rootReducer;