import { Route } from 'react-router';
import Upload from './upload';
import NewDsFromXls from './NewDsFromXls';
import NewDsFromCsv from './NewDsFromCsv';
import DsHome from './DsHome';
import DsView from './DsView';
import DsViewEdit from './DsViewEdit';
import DsEditLog from './DsEditLog';
import DsBulkEdit from './DsBulkEdit';
import HomeMenu from './Menu'
import AllDs from './AllDs';
import DsAttachments from './DsAttachments';
import React from 'react'

export default [ <Route path="/newDsXlsx" exact component={NewDsFromXls}/>,
                 <Route path="/newDsCsv" exact component={NewDsFromCsv}/>,
                 <Route path="/test" exact component={Upload}/>, 
                 <Route path="/" exact component={AllDs}/>, 
                 <Route path="/ds/:dsName" exact component={DsHome}/>, 
                 <Route path="/ds/:dsName/:dsView" component={DsView}/>,
                 <Route path="/dsViewEdit/:dsName/:dsView" exact component={DsViewEdit}/>,
                 <Route path="/dsEditLog/:dsName" exact component={DsEditLog}/>,
                 <Route path="/dsBulkEdit/:dsName" exact component={DsBulkEdit}/>, 
                 <Route path="/dsAttachments/:dsName" exact component={DsAttachments}/>,
                 ]
export { HomeMenu }