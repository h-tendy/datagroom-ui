import React, { Component, useState } from "react";
import Select from 'react-select'
import { Button, Col, Row, Container, FormControl, DropdownButton, Dropdown } from "react-bootstrap";
import Form from 'react-bootstrap/Form'

class JiraForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            formData: {
                ...this.props.formData
            }
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
        for (let i = 0; i < this.projectsMetaData.projects[0].issuetypes.length; i++) {
            if (this.projectsMetaData.projects[0].issuetypes[i].name === this.state.formData.Type) {
                this.fields = this.projectsMetaData.projects[0].issuetypes[i].fields
                this.fieldsKey = Object.keys(this.fields)
                for (let j = 0; j < this.fieldsKey.length; j++) {
                    if (this.fields[this.fieldsKey[j]].type === "array" && this.fields[this.fieldsKey[j]].allowedValues) {
                        this.allowedValues[this.fieldsKey[j]] = []
                        for (let k = 0; k < this.fields[this.fieldsKey[j]].allowedValues.length; k++) {
                            let currVal = this.fields[this.fieldsKey[j]].allowedValues[k]
                            let obj = {};
                            obj.label = currVal
                            obj.value = currVal
                            this.allowedValues[this.fieldsKey[j]].push(obj)
                        }
                    }
                }
                break
            }
        }
        let obj = {};
        obj["Project"] = this.projectsMetaData.projects[0].key
        this.props.handleChange(obj)
        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                Project: this.projectsMetaData.projects[0].key
            }
        })
    }

    handleChange = (event) => {
        if (event.target.name == "Project") {
            this.projectName = event.target.value
        } else if (event.target.name == "Type") {
            for (let i = 0; i < this.projectsMetaData.projects[0].issuetypes.length; i++) {
                if (this.projectsMetaData.projects[0].issuetypes[i].name === event.target.value) {
                    this.fields = this.projectsMetaData.projects[0].issuetypes[i].fields
                    this.fieldsKey = Object.keys(this.fields)
                    for (let j = 0; j < this.fieldsKey.length; j++) {
                        if (this.fields[this.fieldsKey[j]].type === "array" && this.fields[this.fieldsKey[j]].allowedValues) {
                            this.allowedValues[this.fieldsKey[j]] = []
                            for (let k = 0; k < this.fields[this.fieldsKey[j]].allowedValues.length; k++) {
                                let currVal = this.fields[this.fieldsKey[j]].allowedValues[k]
                                let obj = {};
                                obj.label = currVal
                                obj.value = currVal
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
        if (event.target.name == "Project" || event.target.name == "JIRA_AGILE_LABEL" || event.target.name == "Type") {
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
                                        {this.props.projectsMetaData.projects.map((item) => <option key={item.key} value={`${item.key}`}>{item.key}</option>)}
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
                                        {key === "customfield_12790" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "parent" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {key === "assignee" && <Form.Control
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
                                            value={this.state.formData[this.state.formData.Type][key]}
                                            onChange={this.handleChange}
                                        />}
                                        {this.fields[key].type === "string" && key !== "description" && <Form.Control
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