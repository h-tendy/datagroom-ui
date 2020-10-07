import { Route } from 'react-router';
import Upload from './upload';
import NewDsFromXls from './NewDsFromXls';
import DsHome from './DsHome';
import DsView from './DsView';
import DsViewEdit from './DsViewEdit';
import DsEditLog from './DsEditLog';
import HomeMenu from './Menu'
import AllDs from './AllDs';
import React from 'react'

export default [ <Route path="/newDs" exact component={NewDsFromXls}/>,
                 <Route path="/test" exact component={Upload}/>, 
                 <Route path="/" exact component={AllDs}/>, 
                 <Route path="/ds/:dsName" exact component={DsHome}/>, 
                 <Route path="/ds/:dsName/:dsView" component={DsView}/>,
                 <Route path="/dsViewEdit/:dsName/:dsView" exact component={DsViewEdit}/>,
                 <Route path="/dsEditLog/:dsName" exact component={DsEditLog}/>,
                 ]
export { HomeMenu }