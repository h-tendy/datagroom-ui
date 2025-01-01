import React, { Component } from "react";
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable';
import { Col, Row, Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form'

class JiraForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            formData: {
                ...this.props.formData
            },
        }
        this.projectsMetaData = null
        this.projects = []
        this.projectName = null
        this.fields = null
        this.fieldsKey = null
        this.allowedValues = {}
    }

    componentDidMount() {
        this.projectsMetaData = this.props.projectsMetaData
        for (let i = 0; i < this.projectsMetaData.issuetypes.length; i++) {
            if (this.projectsMetaData.issuetypes[i].name === this.state.formData.Type) {
                this.fields = this.projectsMetaData.issuetypes[i].fields
                this.fieldsKey = Object.keys(this.fields)
                for (let j = 0; j < this.fieldsKey.length; j++) {
                    if ((this.fields[this.fieldsKey[j]].type === "array" || this.fields[this.fieldsKey[j]].type === "creatableArray") && this.fields[this.fieldsKey[j]].allowedValues) {
                        this.allowedValues[this.fieldsKey[j]] = []
                        for (let k = 0; k < this.fields[this.fieldsKey[j]].allowedValues.length; k++) {
                            let currVal = this.fields[this.fieldsKey[j]].allowedValues[k]
                            let obj = {};
                            obj.label = currVal
                            obj.value = currVal
                            this.allowedValues[this.fieldsKey[j]].push(obj)
                        }
                    } else if (this.fields[this.fieldsKey[j]].type === "searchableOption" && this.fields[this.fieldsKey[j]].allowedValues) {
                        this.allowedValues[this.fieldsKey[j]] = []
                        for (let k = 0; k < this.fields[this.fieldsKey[j]].allowedValues.length; k++) {
                            let currVal = this.fields[this.fieldsKey[j]].allowedValues[k]
                            let obj = {};
                            obj.value = currVal.key
                            obj.label = `${currVal.key} - ${currVal.summary}`
                            this.allowedValues[this.fieldsKey[j]].push(obj)
                        }
                    }
                }
                break
            }
        }
        let obj = {};
        obj["Project"] = this.projectsMetaData.key
        this.props.handleChange(obj)
        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                Project: this.projectsMetaData.key
            }
        })
    }

    handleChange = (event) => {
        if (event.target.name == "Project") {
            this.projectName = event.target.value
        } else if (event.target.name == "Type") {
            for (let i = 0; i < this.projectsMetaData.issuetypes.length; i++) {
                if (this.projectsMetaData.issuetypes[i].name === event.target.value) {
                    this.fields = this.projectsMetaData.issuetypes[i].fields
                    this.fieldsKey = Object.keys(this.fields)
                    for (let j = 0; j < this.fieldsKey.length; j++) {
                        if ((this.fields[this.fieldsKey[j]].type === "array" || this.fields[this.fieldsKey[j]].type === "creatableArray") && this.fields[this.fieldsKey[j]].allowedValues) {
                            this.allowedValues[this.fieldsKey[j]] = []
                            for (let k = 0; k < this.fields[this.fieldsKey[j]].allowedValues.length; k++) {
                                let currVal = this.fields[this.fieldsKey[j]].allowedValues[k]
                                let obj = {};
                                obj.label = currVal
                                obj.value = currVal
                                this.allowedValues[this.fieldsKey[j]].push(obj)
                            }
                        } else if (this.fields[this.fieldsKey[j]].type === "searchableOption" && this.fields[this.fieldsKey[j]].allowedValues) {
                            this.allowedValues[this.fieldsKey[j]] = []
                            for (let k = 0; k < this.fields[this.fieldsKey[j]].allowedValues.length; k++) {
                                let currVal = this.fields[this.fieldsKey[j]].allowedValues[k]
                                let obj = {};
                                obj.value = currVal.key
                                obj.label = `${currVal.key} - ${currVal.summary}`
                                this.allowedValues[this.fieldsKey[j]].push(obj)
                            }
                        }
                    }
                    break
                }
            }
        }     
        let obj = {}
        obj[event.target.name] = event.target.value;
        this.props.handleChange(obj)
        if (event.target.name == "Project" || event.target.name == "JIRA_AGILE_LABEL" || event.target.name == "Type" || event.target.name == "summary" || event.target.name == "description") {
            this.setState({
                ...this.state,
                formData: {
                    ...this.state.formData,
                    [event.target.name]: event.target.value
                }
            })
        } else {
            this.setState({
                ...this.state,
                formData: {
                    ...this.state.formData,
                    [this.state.formData.Type]: {
                        ...this.state.formData[this.state.formData.Type],
                        [event.target.name]: event.target.value
                    }
                }
            })
        }
    };

    handleMultiChange = (e, b, c, d) => {
        let values = []
        if (e) {
            for (let i = 0; i < e.length; i++) {
                values.push(e[i].value)
            }
        }
        let obj = {};
        obj[b.name] = values;
        this.props.handleChange(obj)
        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                [b.name]: values
            }
        })
    }

    handleCreate = (option, event) => {
        try {
            const newOption = { label: option.label, value: option.value };
            this.allowedValues[event.name].push(newOption);
            let obj = {}
            obj[event.name] = option.value;
            this.props.handleChange(obj)
            this.setState({
                ...this.state,
                formData: {
                    ...this.state.formData,
                    [this.state.formData.Type]: {
                        ...this.state.formData[this.state.formData.Type],
                        [event.name]: option.value
                    }
                }
            })
        } catch (e) { }
    };

    handleSelectChange = (selectedOption, event) => {
        let obj = {}
        let selectedValue = ""
        if (event.action == "clear") {
            selectedValue = ""
        } else if (event.action == "create-option") {
            this.handleCreate(selectedOption, event)
            return
        } else if (event.action == "select-option") {
            selectedValue = selectedOption.value;
        }
        obj[event.name] = selectedValue
        this.props.handleChange(obj)
        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                [this.state.formData.Type]: {
                    ...this.state.formData[this.state.formData.Type],
                    [event.name]: selectedValue
                }
            }
        })
    };

    render() {
    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col sm={12}>
                    <Form style={{ display: "flex", flexDirection: "column" }}>
                        <Form.Group controlId="formProject" style={{ marginBottom: "10px" }}>
                            <Form.Row>
                                <Form.Label column sm="4">Project:</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        as="select"
                                        name="Project"
                                        value={this.state.formData.Project}
                                        onChange={this.handleChange}
                                    >
                                        <option key={this.props.projectsMetaData.key} value={`${this.props.projectsMetaData.key}`}>{this.props.projectsMetaData.key}</option>

                                    </Form.Control>
                                </Col>
                            </Form.Row>
                        </Form.Group>
                        {this.props.jiraAgileEnabled && (
                            <Form.Group controlId="formJIRA_AGILE_LABEL" style={{ marginBottom: "10px" }}>
                                <Form.Row>
                                    <Form.Label column sm="4">JIRA AGILE LABEL:</Form.Label>
                                    <Col sm="8">
                                        <Form.Control
                                            as="select"
                                            name="JIRA_AGILE_LABEL"
                                            value={this.state.formData.JIRA_AGILE_LABEL}
                                            onChange={this.handleChange}
                                        >
                                            <option key={"None"} value="None">None</option>
                                            {this.props.jiraAgileBoard && <option key={this.props.jiraAgileBoard} value={`${this.props.jiraAgileBoard}`}>{this.props.jiraAgileBoard}</option>}
                                        </Form.Control>
                                    </Col>
                                </Form.Row>
                            </Form.Group>
                        )}
                        <Form.Group controlId="formType" style={{ marginBottom: "10px" }}>
                            <Form.Row>
                                <Form.Label column sm="4">Type:</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        as="select"
                                        name="Type"
                                        value={this.state.formData.Type}
                                        onChange={this.handleChange}
                                    >
                                        {this.props.jiraAgileEnabled && (<option key={"Epic"} value="Epic">Epic</option>)}
                                        {this.props.jiraAgileEnabled && (<option key={"Story"} value="Story">Story</option>)}
                                        {this.props.jiraAgileEnabled && (<option key={"Story Task"} value="Story Task">Story Task</option>)}
                                        {this.props.jiraEnabled && (<option key={"Bug"} value="Bug">Bug</option>)}
                                    </Form.Control>
                                </Col>
                            </Form.Row>
                        </Form.Group>
                        {this.state.formData.Type != "" && this.fieldsKey && this.fieldsKey.map((key) =>
                        (
                            <Form.Group key={`form${key}`} controlId={`form${key}`} style={{ marginBottom: "10px" }}>
                                <Form.Row>
                                    <Form.Label column sm="4">{this.fields[key].name}:</Form.Label>
                                    <Col sm="8">
                                        {key === "issuelinks" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "customfield_25578" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "customfield_28101" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "customfield_28102" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "description" && <Form.Control
                                            as="textarea"
                                            rows="6"
                                            name={`${key}`}
                                            value={this.state.formData[key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "summary" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[key]}
                                            onChange={this.handleChange}
                                        />}
                                        {this.fields[key].type === "string" && key !== "description" && key !== "summary" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {this.fields[key].type === "option" && <Form.Control
                                            as="select"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        >
                                            {this.fields[key].allowedValues && this.fields[key].allowedValues.map((value) => <option key={value} value={`${value}`}>{value}</option>)}
                                        </Form.Control>
                                        }
                                        {this.fields[key].type === "number" && <Form.Control
                                            type="number"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />
                                        }
                                        {this.fields[key].type === "priority" && <Form.Control
                                            as="select"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        >
                                            {this.fields[key].allowedValues && this.fields[key].allowedValues.map((value) => <option key={value} value={`${value}`}>{value}</option>)}
                                        </Form.Control>
                                        }
                                        {
                                            this.fields[key].type === "array" && this.allowedValues[key] &&
                                            <Select
                                                onChange={this.handleMultiChange}
                                                defaultValue={this.state.formData[this.state.formData.Type][key].map((entry) => {
                                                    return { label: entry, value: entry }
                                                })}
                                                isMulti
                                                name={`${key}`}
                                                options={this.allowedValues[key]}
                                                className="basic-multi-select"
                                                classNamePrefix="select"
                                            />
                                        }
                                        {
                                            this.fields[key].type === "creatableArray" && this.allowedValues[key] &&
                                            <div key={`${this.state.formData[this.state.formData.Type][key]}`}>
                                                <CreatableSelect
                                                    defaultValue={(this.state.formData[this.state.formData.Type][key] != "") ? ({ label: this.state.formData[this.state.formData.Type][key], value: this.state.formData[this.state.formData.Type][key] }) : null}
                                                    isClearable
                                                    name={`${key}`}
                                                    options={this.allowedValues[key]}
                                                    onChange={this.handleSelectChange}
                                                    placeholder="Type to search or add a new option..."
                                                />
                                            </div>
                                        }
                                        {
                                            this.fields[key].type === "searchableOption" && this.allowedValues[key] &&
                                            <div key={`${this.state.formData[this.state.formData.Type][key]}`}>
                                                <Select
                                                    defaultValue={(this.state.formData[this.state.formData.Type][key] != "") ? ({ label: this.state.formData[this.state.formData.Type][key], value: this.state.formData[this.state.formData.Type][key] }) : null}
                                                    isClearable
                                                    isSearchable
                                                    name={`${key}`}
                                                    options={this.allowedValues[key]}
                                                    onChange={this.handleSelectChange}
                                                    placeholder="Type to search or add a new option..."
                                                />
                                            </div>
                                        }
                                    </Col>
                                </Form.Row>
                            </Form.Group>
                        )
                        )}
                    </Form>
                </Col>
            </Row>
        </Container>
    )
    }
}   

export default JiraForm;