import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap'
import { uploadService } from '../../services'  // Call uploadService.fileUpload for sending file to gateway
import 'react-tabulator/lib/styles.css'; // required styles
import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator } from 'react-tabulator';
import DateEditor from 'react-tabulator/lib/editors/DateEditor';
import MultiSelectEditor from 'react-tabulator/lib/editors/MultiSelectEditor';
import MultiValueFormatter from 'react-tabulator/lib/formatters/MultiValueFormatter';
import MyAutoCompleter from './MyAutoCompleter';

require('./styles.css');

  const data = [
    { id: 1, name: 'Oli Bob', age: '12', color: 'red', dob: '01/01/1980', rating: 5, passed: true, pets: ['cat', 'dog'] },
    { id: 2, name: 'Mary May', age: '1', color: 'green', dob: '12/05/1989', rating: 4, passed: true, pets: ['cat'] },
    { id: 3, name: 'Christine Lobowski', age: '42', color: 'green', dob: '10/05/1985', rating: 4, passed: false },
    { id: 4, name: 'Brendon Philips', age: '125', color: 'red', dob: '01/08/1980', rating: 4.5, passed: true },
    { id: 5, name: 'Margret Marmajuke', age: '16', color: 'yellow', dob: '07/01/1999', rating: 4, passed: false },
    {
      id: 6,
      name: 'Van Ng',
      age: '37',
      color: 'green',
      dob: '06/10/1982',
      rating: 4,
      passed: true,
      pets: ['dog', 'fish']
    },
    { id: 7, name: 'Duc Ng', age: '37', color: 'yellow', dob: '10/10/1982', rating: 4, passed: true, pets: ['dog'] }
  ];
  
  // Editable Example:
  const colorOptions = { ['']: '&nbsp;', red: 'red', green: 'green', yellow: 'yellow' };
  const petOptions = [{ id: 'cat', name: 'cat' }, { id: 'dog', name: 'dog' }, { id: 'fish', name: 'fish' }];
  let headerMenu = [
    {
        label:"Toggle Filters",
        action: function(e, column) {
            console.log("Toggle filters!");
            let currentDefs = column.getDefinition();
            let curHdrFilter = currentDefs.headerFilter;
            let curWidth = currentDefs.width;
            column.updateDefinition({headerFilter: curHdrFilter ? false : 'input'});
        }
    }
  ];
const editableColumns = [
    { title: 'Name', field: 'name', editor: 'input', },
    { title: 'Age', field: 'age', hozAlign: 'left', formatter: 'progress', editor: 'progress' },
    {
      title: 'Favourite Color',
      field: 'color',
      editor: MyAutoCompleter,
      editorParams: { allowEmpty: true, showListOnEmpty: true, values: colorOptions, verticalNavigation:"table" },
      formatter: "textarea",
      headerMenu
    },
    { title: 'Date Of Birth', field: 'dob', editor: DateEditor, editorParams: { format: 'MM/DD/YYYY' } },
    {
      title: 'Pets',
      field: 'pets',
      sorter: (a, b) => a.toString().localeCompare(b.toString()),
      editor: MultiSelectEditor,
      editorParams: { values: petOptions },
      formatter: MultiValueFormatter,
      formatterParams: { style: 'PILL' }
    },
    { title: 'Passed?', field: 'passed', hozAlign: 'center', formatter: 'tickCross', editor: true }
  ];

class Upload extends Component {
    constructor(props) {
        super(props)
        this.state = {activeTab:'', file: null};
        this.onFileSelect = this.onFileSelect.bind(this);
        this.onFileUpload = this.onFileUpload.bind(this);
    }
    onFileSelect(event) {
        this.setState({file: event.target.files[0]});
    }
    // On file upload (click the upload button) 
    onFileUpload () { 
        // Create an object of formData 
        const formData = new FormData(); 
        // Update the formData object 
        formData.append( 
            "file", 
            this.state.file, 
            this.state.file.name 
        );     
        // Details of the uploaded file 
         console.log(this.state.file); 
        // Request made to the backend api 
        // Send formData object 
        uploadService.fileUpload(formData);
        //axios.post("api/uploadfile", formData); 
    }; 


    render() {
        return (
                <Row>
                <Col md={12}>
                    <h3>Editable Table</h3>
                    <ReactTabulator
                    columns={editableColumns}
                    data={data}
                    cellEdited={(cell) => console.log('cellEdited:', cell)}
                    dataEdited={(newData) => console.log('dataEdited', newData)}
                    footerElement={<span>Footer</span>}
                    options={{ movableColumns: true, movableRows: false, layout: "fitDataFill", keybindings: {"navRight": 39, "navLeft": 37} }}
                    />
                    <input type="file" name="file" onChange={this.onFileSelect} />
                    <button onClick={this.onFileUpload}> 
                        Upload! 
                    </button> 
                </Col>
                </Row>
        )
    }
}

export default Upload