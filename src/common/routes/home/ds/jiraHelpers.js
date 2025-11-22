import React from 'react';
import JiraForm from '../jiraForm.js';
import { dsService } from '../../../services';

// NOTE: The functions in this helper were extracted from `DsView.js` to
// reduce component size. The original inline fallback implementations
// contained several explanatory comments about modal flows, validation
// and JIRA-specific behavior (Bug vs Epic/Story handling). Those comments
// and behavior are preserved here next to the extracted functions so
// reviewers can find the original intent easily.

export default function createJiraHelpers(context) {
  const { props, component, getState, setState } = context;

  async function convertToJiraRow(e, cell) {
    let self = component;
    const { match, dsHome, user } = component.props;
    let dsView = match.params.dsView;
    let dsName = match.params.dsName;
    let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
    let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
    let jiraProjectName = dsHome.dsViews[dsView].jiraProjectName;
    let dsUser = user.user;
    if (!jiraProjectName) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Jira Project Name not configured. Please go to "Edit-view" of the dataset and add Jira Project Name same as that in JIRA. Reload this page.`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if ((!jiraConfig || !jiraConfig.jira) && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to convert to JIRA row`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    let data = cell.getRow().getData();
    if (isJiraRow(data, jiraConfig, jiraAgileConfig)) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Already a JIRA row. Cannot convert it further.!!`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    let projectsMetaData = await dsService.getProjectsMetaData({ dsName, dsView, dsUser, jiraAgileConfig, jiraConfig, jiraProjectName });
    if (!projectsMetaData || Object.keys(projectsMetaData).length == 0) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Unable to fetch projects metaData. Update JiraSettings correctly to fetch metadata.`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    let copyOfDefaults = JSON.parse(JSON.stringify(component.getDefaultTypeFieldsAndValuesForProject(dsHome.defaultTypeFieldsAndValues.value.projects, jiraProjectName).issuetypes));
    component.jiraFormData = {
      ...component.jiraFormData,
      ...copyOfDefaults
    };
    if (jiraAgileConfig && jiraAgileConfig.label) {
      component.jiraFormData.JIRA_AGILE_LABEL = jiraAgileConfig.label;
    }
    fillLocalStorageItemData(projectsMetaData.issuetypes);
    let rowData = cell.getRow().getData();
    formInitialJiraForm(rowData, jiraConfig, jiraAgileConfig);
    if (component.jiraFormData.Type == "Bug" && (!jiraConfig || !jiraConfig.jira)) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Trying to convert Bug type without enabling the Jira. Please enable it first in edit-view`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if ((component.jiraFormData.Type == "Epic" || component.jiraFormData.Type == "Story" || component.jiraFormData.Type == "Story Task") && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Trying to convert ${component.jiraFormData.Type} type without enabling the Jira_Agile. Please enable it first in edit-view`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if ((jiraConfig && jiraConfig.jira) || (jiraAgileConfig && jiraAgileConfig.jira)) {
      let _id = cell.getRow().getData()['_id'];
      let selectorObj = {};
      selectorObj["_id"] = _id;
      for (let i = 0; i < dsHome.dsViews[dsView].keys.length; i++) {
        let key = dsHome.dsViews[dsView].keys[i];
        selectorObj[key] = cell.getRow().getData()[key];
      }
      let jiraAgileBoard = jiraAgileConfig.label;
      component.setState({
        modalTitle: "Jira row specifications:- ",
        modalOk: "Convert",
        modalQuestion: <JiraForm formData={component.jiraFormData} handleChange={handleJiraFormChange} jiraEnabled={dsHome.dsViews[dsView].jiraConfig && dsHome.dsViews[dsView].jiraConfig.jira} jiraAgileEnabled={dsHome.dsViews[dsView].jiraAgileConfig && dsHome.dsViews[dsView].jiraAgileConfig.jira} jiraAgileBoard={jiraAgileBoard} projectsMetaData={projectsMetaData} />,
        modalCallback: (confirmed) => {
          submitJiraFormChange(confirmed, _id, selectorObj);
        },
        showModal: !component.state.showModal,
        toggleModalOnClose: false,
      });
    } else {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `<b>Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to convert to JIRA row</b>`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { self.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
    }
  }


  function validateAndGetDefaultValue(issueTypes, issueType, field, value) {
    let isValidated = false;
    let defaultValue = null;
    if (field === "customfield_25578") {
      isValidated = true;
      defaultValue = value;
      return { isValidated, defaultValue };
    }
    for (let i = 0; i < issueTypes.length; i++) {
      if (issueTypes[i].name != issueType) { continue }
      let currIssueObj = issueTypes[i];
      let fieldObj = currIssueObj.fields[field];
      if (fieldObj) {
        if (fieldObj.type == "array" && fieldObj.allowedValues) {
          for (let k = 0; k < value.length; k++) {
            if (!fieldObj.allowedValues.includes(value[k])) {
              isValidated = false;
              return { isValidated, defaultValue };
            }
          }
          isValidated = true;
          defaultValue = value;
          return { isValidated, defaultValue };
        } else if (fieldObj.type == "option" && fieldObj.allowedValues) {
          if (fieldObj.allowedValues.includes(value)) {
            isValidated = true;
            defaultValue = value;
            return { isValidated, defaultValue };
          } else {
            isValidated = false;
            return { isValidated, defaultValue };
          }
        } else if (fieldObj.type == "creatableArray" && fieldObj.allowedValues) {
          if (fieldObj.allowedValues.includes(value)) {
            isValidated = true;
            defaultValue = value;
            return { isValidated, defaultValue };
          } else {
            isValidated = false;
            return { isValidated, defaultValue };
          }
        } else if (fieldObj.type == "searchableOption" && fieldObj.allowedValues) {
          let allowedValues = fieldObj.allowedValues.map((e) => e.key);
          if (allowedValues.includes(value)) {
            isValidated = true;
            defaultValue = value;
            return { isValidated, defaultValue };
          } else {
            isValidated = false;
            return { isValidated, defaultValue };
          }
        } else {
          isValidated = true;
          defaultValue = value;
          return { isValidated, defaultValue };
        }
      } else {
        return { isValidated, defaultValue };
      }
    }
    return { isValidated, defaultValue };
  }

  function formInitialJiraForm(rowData, jiraConfig, jiraAgileConfig) {
    try {
      let fieldMapping = null;
      if (jiraConfig && jiraConfig.jira) {
        fieldMapping = jiraConfig.jiraFieldMapping;
      }
      if (jiraAgileConfig && jiraAgileConfig.jira) {
        fieldMapping = {
          ...fieldMapping,
          ...jiraAgileConfig.jiraFieldMapping
        };
      }
      if (!fieldMapping) return;
      const jiraCustomFieldMapping = { 'Story Points': 'customfield_11890' };
      let summary = "";
      let description = "";
      let descriptionDone = false;
      let type = "";
      let storyPoints = 0;
      if (fieldMapping["summary"]) {
        let value = rowData[fieldMapping["summary"]] || "";
        let arr = value.split("\n");
        if (arr.length >= 2) {
          let summaryLine = arr[0];
          let matchArr = summaryLine.match((/#+(.*)/));
          if (matchArr && matchArr.length >= 2) {
            summary = matchArr[1].trim();
          } else {
            summary = summaryLine;
          }
          description = arr.join("\n").trim();
          descriptionDone = true;
        } else if (arr.length == 1) {
          let summaryLine = arr[0];
          let matchArr = summaryLine.match((/#+(.*)/));
          if (matchArr && matchArr.length >= 2) {
            summary = matchArr[1].trim();
          } else {
            summary = summaryLine;
          }
        }
      }
      if (fieldMapping["type"]) {
        try {
          const v = (rowData[fieldMapping["type"]] || "").toString();
          if (v.match(/(t|T)ask/))
            type = "Story Task";
          else if (v.match(/(b|B)ug/))
            type = "Bug";
          else if (v.match(/(e|E)pic/))
            type = "Epic";
          else if (v.match(/(s|S)tory/))
            type = "Story";
        } catch (e) { }
      }
      if (!descriptionDone && fieldMapping["description"]) {
        description = (rowData[fieldMapping["description"]] || "").trim();
      }
      if (fieldMapping["Story Points"]) {
        try {
          if (typeof rowData[fieldMapping["Story Points"]] == 'number')
            storyPoints = rowData[fieldMapping["Story Points"]];
          else if (typeof rowData[fieldMapping["Story Points"]] == 'string')
            storyPoints = parseInt(rowData[fieldMapping["Story Points"]]);
        } catch (e) { }
      }

      if (type == "Epic" || type == "Story" || type == "Bug" || type == "Story Task") {
        component.jiraFormData["Type"] = type;
      }
      component.jiraFormData['summary'] = summary;
      component.jiraFormData['description'] = description;
      for (let key of Object.keys(component.jiraFormData)) {
        if (typeof component.jiraFormData[key] != 'object') continue;
        if (storyPoints != 0 && jiraCustomFieldMapping['Story Points']) {
          if (component.jiraFormData[key][jiraCustomFieldMapping['Story Points']] == 0 || component.jiraFormData[key][jiraCustomFieldMapping['Story Points']]) component.jiraFormData[key][jiraCustomFieldMapping['Story Points']] = storyPoints;
        }
      }
    } catch (e) { }
  }

  // Populate jiraFormData fields from localStorage where valid.
  // This was moved from DsView.js to keep JIRA-related logic together.
  function fillLocalStorageItemData(issueTypes) {
    try {
      for (let key of Object.keys(component.jiraFormData)) {
        if (typeof component.jiraFormData[key] == "object") {
          let localStorageItem = localStorage.getItem(key);
          if (localStorageItem && localStorageItem != "undefined") {
            let parsedLocalItem = JSON.parse(localStorageItem);
            for (let parsedKey of Object.keys(parsedLocalItem)) {
              if (component.jiraFormData[key].hasOwnProperty(parsedKey)) {
                let { isValidated, defaultValue } = validateAndGetDefaultValue(issueTypes, key, parsedKey, parsedLocalItem[parsedKey]);
                if (isValidated && defaultValue != null) {
                  component.jiraFormData[key][parsedKey] = defaultValue;
                }
              }
            }
          }
        }
      }
      if (localStorage.getItem('JIRA_AGILE_LABEL') && localStorage.getItem('JIRA_AGILE_LABEL') != "undefined") {
        component.jiraFormData.JIRA_AGILE_LABEL = localStorage.getItem('JIRA_AGILE_LABEL');
      }
    } catch (e) { }
  }

  function isJiraRow(data, jiraConfig, jiraAgileConfig) {
    let fieldMapping = null;
    if (jiraConfig && jiraConfig.jira) {
      fieldMapping = jiraConfig.jiraFieldMapping;
    }
    if (jiraAgileConfig && jiraAgileConfig.jira) {
      fieldMapping = {
        ...fieldMapping,
        ...jiraAgileConfig.jiraFieldMapping
      };
    }
    if (!fieldMapping) return false;
    try {
      let key = data[fieldMapping['key']];
      if (!key) return false;
      if (key.match(/https:(.*)\/browse\//)) return true;
    } catch (e) { }
    return false;
  }

  async function addJiraRow(e, cell, type) {
    const { match, dsHome, user } = component.props;
    let dsView = match.params.dsView;
    let dsName = match.params.dsName;
    let dsUser = user.user;
    let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
    let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
    let jiraProjectName = dsHome.dsViews[dsView].jiraProjectName;
    if (!jiraProjectName) {
      component.setState({
        modalTitle: "Add JIRA status",
        modalQuestion: `Jira Project Name not configured. Please go to "Edit-view" of the dataset and add Jira Project Name same as that in JIRA. Reload this page.`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if ((!jiraConfig || !jiraConfig.jira) && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
      component.setState({
        modalTitle: "Add JIRA status",
        modalQuestion: `Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to add a JIRA row`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if (cell && type) {
      let rowData = cell.getRow().getData();
      if (!isJiraRow(rowData, jiraConfig, jiraAgileConfig)) {
        component.setState({
          modalTitle: "Add JIRA status",
          modalQuestion: `Cannot add JIRA as child of non-Jira row`,
          modalOk: "Dismiss",
          modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
          showModal: true
        });
        return;
      }
      let isValid = checkIfValid(rowData, type, jiraConfig, jiraAgileConfig);
      if (!isValid) {
        component.setState({
          modalTitle: "Add JIRA status",
          modalQuestion: `Can't add ${type} to current row.`,
          modalOk: "Dismiss",
          modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
          showModal: true
        });
        return;
      }
    }
    let projectsMetaData = await dsService.getProjectsMetaData({ dsName, dsView, dsUser, jiraAgileConfig, jiraConfig, jiraProjectName });
    if (!projectsMetaData || Object.keys(projectsMetaData).length == 0) {
      component.setState({
        modalTitle: "Add JIRA status",
        modalQuestion: `Unable to fetch projects metaData. Update JiraSettings correctly to fetch metadata.`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    let copyOfDefaults = JSON.parse(JSON.stringify(component.getDefaultTypeFieldsAndValuesForProject(dsHome.defaultTypeFieldsAndValues.value.projects, jiraProjectName).issuetypes));
    component.jiraFormData = {
      ...component.jiraFormData,
      ...copyOfDefaults
    };
    if (jiraAgileConfig && jiraAgileConfig.label) {
      component.jiraFormData.JIRA_AGILE_LABEL = jiraAgileConfig.label;
    }
    fillLocalStorageItemData(projectsMetaData.issuetypes);
    if (type) component.jiraFormData.Type = type;
    if (component.jiraFormData.Type == "Bug" && (!jiraConfig || !jiraConfig.jira)) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Trying to add Bug type without enabling the Jira. Please enable it first in edit-view`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if ((component.jiraFormData.Type == "Epic" || component.jiraFormData.Type == "Story" || component.jiraFormData.Type == "Story Task") && (!jiraAgileConfig || !jiraAgileConfig.jira)) {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `Trying to add ${component.jiraFormData.Type} type without enabling the Jira_Agile. Please enable it first in edit-view`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
      return;
    }
    if ((jiraConfig && jiraConfig.jira) || (jiraAgileConfig && jiraAgileConfig.jira)) {
      let jiraAgileBoard = null;
      try {
        jiraAgileBoard = jiraAgileConfig.label;
        component.jiraFormData.JIRA_AGILE_LABEL = jiraAgileBoard;
      } catch (e) { }
      let jiraId = null;
      let selectorObj = null;
      if (type) {
        jiraId = getJiraId(cell.getRow().getData(), jiraConfig, jiraAgileConfig);
        if (component.jiraFormData.Type == 'Story') {
          component.jiraFormData[component.jiraFormData.Type].customfield_12790 = jiraId;
        } else if (component.jiraFormData.Type == "Story Task") {
          component.jiraFormData[component.jiraFormData.Type].parent = jiraId;
        }
        let _id = cell.getRow().getData()['_id'];
        selectorObj = {};
        selectorObj["_id"] = _id;
      }
      component.setState({
        modalTitle: "Jira specifications:- ",
        modalOk: "Add",
        modalQuestion: <JiraForm formData={component.jiraFormData} handleChange={handleJiraFormChange} jiraEnabled={dsHome.dsViews[dsView].jiraConfig && dsHome.dsViews[dsView].jiraConfig.jira} jiraAgileEnabled={dsHome.dsViews[dsView].jiraAgileConfig && dsHome.dsViews[dsView].jiraAgileConfig.jira} jiraAgileBoard={jiraAgileBoard} projectsMetaData={projectsMetaData} />,
        modalCallback: (confirmed) => {
          submitAddJira(confirmed, jiraId, selectorObj);
        },
        showModal: !component.state.showModal,
        toggleModalOnClose: false
      });
    } else {
      component.setState({
        modalTitle: "Convert JIRA status",
        modalQuestion: `<b>Both JIRA/JIRA_AGILE config is disabled. Enable anyone or both to convert to JIRA row</b>`,
        modalOk: "Dismiss",
        modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
        showModal: true
      });
    }
  }

  function checkIfValid(rowData, type, jiraConfig, jiraAgileConfig) {
    let fieldMapping = null;
    if (jiraConfig && jiraConfig.jira) {
      fieldMapping = jiraConfig.jiraFieldMapping;
    }
    if (jiraAgileConfig && jiraAgileConfig.jira) {
      fieldMapping = {
        ...fieldMapping,
        ...jiraAgileConfig.jiraFieldMapping
      };
    }
    if (!fieldMapping) return false;
    try {
      if (type == 'Story' && rowData[fieldMapping['type']] == 'Epic') {
        return true;
      } else if (type == 'Story Task' && rowData[fieldMapping['type']] == 'Story') {
        return true;
      } else {
        return false;
      }
    } catch (e) { return false }
  }

  function getJiraId(rowData, jiraConfig, jiraAgileConfig) {
    let fieldMapping = null;
    if (jiraConfig && jiraConfig.jira) {
      fieldMapping = jiraConfig.jiraFieldMapping;
    }
    if (jiraAgileConfig && jiraAgileConfig.jira) {
      fieldMapping = {
        ...fieldMapping,
        ...jiraAgileConfig.jiraFieldMapping
      };
    }
    try {
      let key = rowData[fieldMapping['key']];
      let regex = new RegExp(`/browse/(.*)\\)`);
      let jiraIssueIdMatchArr = key.match(regex);
      if (jiraIssueIdMatchArr && jiraIssueIdMatchArr.length >= 2) {
        key = jiraIssueIdMatchArr[1];
      }
      return key;
    } catch (e) { }
    return "";
  }

  async function submitAddJira(confirmed, parentKey, parentSelectorObj) {
    if (confirmed) {
      const { dispatch, match, user, dsHome } = component.props;
      let dsName = match.params.dsName;
      let dsView = match.params.dsView;
      let username = user.user;
      let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
      let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
      let jiraFormData = formFinalJiraFormData();
      updateLocalStorage(jiraFormData);
      if (jiraFormData.Type == "Bug") {
        jiraFormData[jiraFormData.Type].customfield_25578 = jiraFormData[jiraFormData.Type].customfield_25578.split(",");
      }
      let response = await dsService.addJiraRow({ dsName, dsView, username, jiraFormData, jiraConfig, jiraAgileConfig, parentKey, parentSelectorObj });
      let secondaryModalStatus = component.state.modalStatus;
      let modalStatus = component.state.modalStatus;
      let showSecondaryModal = false;
      if (response) {
        if (response.status == 'success') {
          let fullUpdatedRec = response.record;
          let update = {
            _id: response._id,
            ...fullUpdatedRec
          };
          component.ref.table.addRow(update, true, null);
          if (response.parentRecord) {
            let fullParentUpdatedRec = response.parentRecord;
            let update = {
              _id: parentSelectorObj._id,
              ...fullParentUpdatedRec
            };
            component.ref.table.updateData([update]);
          }
          modalStatus += `<b style="color:green">Update done</b> <br/> Jira issue Key for converted row: ${response.key}<br/><br/>`;
          let modalQuestion = modalStatus ? <div dangerouslySetInnerHTML={{ __html: modalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
          component.setState({
            modalTitle: "Convert Status",
            modalQuestion: modalQuestion,
            modalStatus: modalStatus,
            modalOk: "Dismiss",
            modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
            showModal: true,
            toggleModalOnClose: true,
            grayOutModalButtons: false
          });
          let obj = {
            Project: "",
            JIRA_AGILE_LABEL: "None",
            Type: "Epic",
          };
          component.jiraFormData = obj;
          component.jiraFormData = {
            ...component.jiraFormData,
            ...dsHome.defaultTypeFieldsAndValues.value.projects[0].issuetypes
          };
        } else {
          secondaryModalStatus += `Update <b style="color:red">failed</b><br/> <b style="color:red">Error: ${response.error})</b><br/><br/>`;
          showSecondaryModal = true;
        }
      } else {
        secondaryModalStatus += `Update <b style="color:red">failed</b><br/><br/>`;
        showSecondaryModal = true;
      }
      if (showSecondaryModal) {
        let secondaryModalQuestion = secondaryModalStatus ? <div dangerouslySetInnerHTML={{ __html: secondaryModalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
        component.setState({
          secondaryModalTitle: "Convert Status",
          secondaryModalQuestion: secondaryModalQuestion,
          secondaryModalStatus: secondaryModalStatus,
          secondaryModalOk: "Dismiss",
          secondaryModalCallback: (confirmed) => { component.setState({ showSecondaryModal: false, secondaryModalQuestion: '', secondaryModalStatus: '', grayOutModalButtons: false }) },
          showSecondaryModal: true
        });
      }
    } else {
      component.setState({ showModal: !component.state.showModal, toggleModalOnClose: true });
    }
  }

  async function submitJiraFormChange(confirmed, _id, selectorObj) {
    if (confirmed) {
      const { dispatch, match, user, dsHome } = component.props;
      let dsName = match.params.dsName;
      let dsView = match.params.dsView;
      let username = user.user;
      let jiraConfig = dsHome.dsViews[dsView].jiraConfig;
      let jiraAgileConfig = dsHome.dsViews[dsView].jiraAgileConfig;
      let jiraFormData = formFinalJiraFormData();
      updateLocalStorage(jiraFormData);
      if (jiraFormData.Type == "Bug") {
        //Just before sending change the value of key customfield_25578 to array
        jiraFormData[jiraFormData.Type].customfield_25578 = jiraFormData[jiraFormData.Type].customfield_25578.split(",");
      }
      // reset the jiraFormData value
      let response = await dsService.convertToJira({ dsName, dsView, username, jiraFormData, jiraConfig, jiraAgileConfig, _id, selectorObj });
      let secondaryModalStatus = component.state.modalStatus;
      let modalStatus = component.state.modalStatus;
      let showSecondaryModal = false;
      if (response) {
        if (response.status == 'success') {
          let fullUpdatedRec = response.record;
          let update = {
            _id: response._id,
            ...fullUpdatedRec
          };
          try {
            component.ref.table.addRow(update, true, null);
          } catch (e) { }
          if (response.parentRecord) {
            let fullParentUpdatedRec = response.parentRecord;
            let update = {
              _id: selectorObj._id,
              ...fullParentUpdatedRec
            };
            try { component.ref.table.updateData([update]); } catch (e) { }
          }
          modalStatus += `<b style="color:green">Update done</b> <br/> Jira issue Key for converted row: ${response.key}<br/><br/>`;
          let modalQuestion = modalStatus ? <div dangerouslySetInnerHTML={{ __html: modalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
          component.setState({
            modalTitle: "Convert Status",
            modalQuestion: modalQuestion,
            modalStatus: modalStatus,
            modalOk: "Dismiss",
            modalCallback: (confirmed) => { component.setState({ showModal: false, modalQuestion: '', modalStatus: '' }) },
            showModal: true,
            toggleModalOnClose: true,
            grayOutModalButtons: false
          });
          let obj = {
            Project: "",
            JIRA_AGILE_LABEL: "None",
            Type: "Epic",
          };
          component.jiraFormData = obj;
          component.jiraFormData = {
            ...component.jiraFormData,
            ...dsHome.defaultTypeFieldsAndValues.value.projects[0].issuetypes
          };
        } else {
          secondaryModalStatus += `Update <b style="color:red">failed</b><br/> <b style="color:red">Error: ${response.error})</b><br/><br/>`;
          showSecondaryModal = true;
        }
      } else {
        secondaryModalStatus += `Update <b style="color:red">failed</b><br/><br/>`;
        showSecondaryModal = true;
      }
      if (showSecondaryModal) {
        let secondaryModalQuestion = secondaryModalStatus ? <div dangerouslySetInnerHTML={{ __html: secondaryModalStatus }} /> : <div dangerouslySetInnerHTML={{ __html: '<b style="color:green">Convert Success</b>' }} />;
        component.setState({
          secondaryModalTitle: "Convert Status",
          secondaryModalQuestion: secondaryModalQuestion,
          secondaryModalStatus: secondaryModalStatus,
          secondaryModalOk: "Dismiss",
          secondaryModalCallback: (confirmed) => { component.setState({ showSecondaryModal: false, secondaryModalQuestion: '', secondaryModalStatus: '', grayOutModalButtons: false }) },
          showSecondaryModal: true
        });
      }
    } else {
      component.setState({ showModal: !component.state.showModal, toggleModalOnClose: true });
    }
  }

  function updateLocalStorage(jiraFormData) {
    try {
      localStorage.setItem("JIRA_AGILE_LABEL", jiraFormData.JIRA_AGILE_LABEL);
      for (let key of Object.keys(jiraFormData)) {
        if (typeof jiraFormData[key] == "object") {
          let objStringified;
          let obj = {
            ...jiraFormData[key]
          };
          if (obj["summary"]) obj["summary"] = "";
          if (obj["description"]) obj["description"] = "";
          if (obj["customfield_12791"]) obj["customfield_12791"] = "";
          objStringified = JSON.stringify(obj);
          localStorage.setItem(key, objStringified);
        }
      }
    } catch (e) { }
  }

  function handleJiraFormChange(e) {
    let key = Object.keys(e)[0];
    if (key && key === "Project" || key == "JIRA_AGILE_LABEL" || key == "Type" || key === "summary" || key === "description") {
      component.jiraFormData = {
        ...component.jiraFormData,
        [key]: e[key]
      };
    } else {
      component.jiraFormData = {
        ...component.jiraFormData,
        [component.jiraFormData.Type]: {
          ...component.jiraFormData[component.jiraFormData.Type],
          ...e
        }
      };
    }
  }

  function formFinalJiraFormData() {
    let jiraFormData = JSON.parse(JSON.stringify(component.jiraFormData));
    for (let field of Object.keys(jiraFormData)) {
      if (!jiraFormData[field]) continue;
      if (typeof jiraFormData[field] !== 'object') continue;
      jiraFormData[field].summary = jiraFormData.summary;
      jiraFormData[field].description = jiraFormData.description;
    }
    delete jiraFormData.summary;
    delete jiraFormData.description;
    return jiraFormData;
  }

  return {
    convertToJiraRow,
    validateAndGetDefaultValue,
    formInitialJiraForm,
    isJiraRow,
    addJiraRow,
    checkIfValid,
    getJiraId,
    submitAddJira,
    submitJiraFormChange,
    updateLocalStorage,
    handleJiraFormChange,
    formFinalJiraFormData
  };
}

