import React, { Component, useState } from "react";
import Select from 'react-select'
import { Form, Button, Col, Row, Container, FormControl, DropdownButton, Dropdown } from "react-bootstrap";

class JiraForm extends Component {
    constructor(props) {
        super(props)
        this.state = {
            formData: {
                Project: "",
                JIRA_AGILE_ID: "None",
                Type: "Epic",
                Status: "None",
                Size: "",
                summary: "",
                Description: ""
            },
            searchTerm: '',
            selectedValue: ''
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
        let event = {};
        event.target = {};
        event.target.name = "Project";
        event.target.value = this.projectsMetaData.projects[0].name;
        this.props.handleChange(event)

        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                Project: this.projectsMetaData.projects[0].name
            }
        })
    }

    handleChange = (event) => {
        console.log("EVENTXXX", event.target.name, event.target.value)
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
        console.log("Fields", this.fields)
        console.log("FieldsKey", this.fieldsKey)
        this.props.handleChange(event)
        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                [event.target.name]: event.target.value
            }
        })
    };

    handleMultiChange = (e, b, c, d) => {
        let values = []
        for (let i = 0; i < e.length; i++) {
            values.push(e[i].value)
        }
        let event = {};
        event.target = {};
        event.target.name = b.name;
        event.target.value = values;
        this.props.handleChange(event)
        this.setState({
            ...this.state,
            formData: {
                ...this.state.formData,
                [b.name]: values
            }
        })
    }

    handleSearch = (e) => {
        this.setState({
            searchTerm: e.target.value
        })
    };

    handleSelect = (value) => {
        this.setState({
            selectedValue: value
        })
    };

    // const [formData, setFormData] = useState({
    //     JIRA_AGILE_ID: "None",
    //     Summary: "",
    //     Size: "",
    //     Type: "Epic",
    //     Status: "None",
    // });

    // const handleChange = (event) => {
    //     if (event.target.name === "Type") {
    //         let options = event.target.options;
    //         let value = [];
    //         for (let i = 0, l = options.length; i < l; i++) {
    //             if (options[i].selected) {
    //                 value.push(options[i].value);
    //             }
    //         }
    //         setFormData({
    //             ...formData,
    //             [event.target.name]: value,
    //         });
    //     } else {
    //         setFormData({
    //             ...formData,
    //             [event.target.name]: event.target.value,
    //         });
    //     }
    //     props.handleChange(event)
    // };

    render() {
    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col sm={12}>
                    <Form>
                        <Form.Group controlId="formProject">
                            <Form.Row style={{ paddingBottom: "45px" }}>
                                <Form.Label column sm="4">Project:</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        as="select"
                                        name="Project"
                                        value={this.state.formData.Project}
                                        onChange={this.handleChange}
                                    >
                                        {this.props.projectsMetaData.projects.map((item) => <option key={item.name} value={`${item.name}`}>{item.name}</option>)}
                                    </Form.Control>
                                </Col>
                            </Form.Row>
                        </Form.Group>
                        {this.props.jiraAgileEnabled && (
                            <Form.Group controlId="formJIRA_AGILE_ID">
                                <Form.Row style={{ paddingBottom: "45px" }}>
                                    <Form.Label column sm="4">JIRA AGILE ID:</Form.Label>
                                    <Col sm="8">
                                        <Form.Control
                                            as="select"
                                            name="JIRA_AGILE_ID"
                                            value={this.state.formData.JIRA_AGILE_ID}
                                            onChange={this.handleChange}
                                        >
                                            <option key={"None"} value="None">None</option>
                                            {this.props.jiraAgileBoard && <option key={this.props.jiraAgileBoard} value={`${this.props.jiraAgileBoard}`}>{this.props.jiraAgileBoard}</option>}
                                        </Form.Control>
                                    </Col>
                                </Form.Row>
                            </Form.Group>
                        )}
                        <Form.Group controlId="formType">
                            <Form.Row style={{ paddingBottom: "45px" }}>
                                <Form.Label column sm="4">Type:</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        as="select"
                                        name="Type"
                                        defaultValue={""}
                                        value={this.state.formData.Type}
                                        onChange={this.handleChange}
                                    >
                                        {this.props.jiraAgileEnabled && (<option key={"Epic"} value="Epic">Epic</option>)}
                                        {this.props.jiraAgileEnabled && (<option key={"User Story"} value="User Story">User Story</option>)}
                                        {this.props.jiraAgileEnabled && (<option key={"Sub-task"} value="Sub-task">Sub-task</option>)}
                                        {this.props.jiraEnabled && (<option key={"Bug"} value="Bug">Bug</option>)}
                                    </Form.Control>
                                </Col>
                            </Form.Row>
                        </Form.Group>
                        {this.state.formData.Type != "" && this.fieldsKey && this.fieldsKey.map((key) =>
                        (
                            <Form.Group controlId={`form${key}`}>
                                <Form.Row style={{ paddingBottom: "45px" }}>
                                    <Form.Label column sm="4">{this.fields[key].name}:</Form.Label>
                                    <Col sm="8">
                                        {this.fields[key].type === "string" && <Form.Control
                                            as="textarea"
                                            rows="1"
                                            name={`${key}`}
                                            value={this.state.formData.summary}
                                            onChange={this.handleChange}
                                        />}
                                        {this.fields[key].type === "option" && <Form.Control
                                            as="select"
                                            name={`${key}`}
                                            value={this.state.formData[key] ? this.state.formData[key] : this.fields[key].allowedValues && this.fields[key].allowedValues[0]}
                                            onChange={this.handleChange}
                                        >
                                            {this.fields[key].allowedValues && this.fields[key].allowedValues.map((value) => <option key={value} value={`${value}`}>{value}</option>)}
                                        </Form.Control>
                                        }
                                        {
                                            this.fields[key].type === "array" &&
                                            <Select
                                                onChange={this.handleMultiChange}
                                                defaultValue={[]}
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

                        {/* {formData.Type === "Bug" && (
                                <Form.Group controlId="formStatus">
                                    <Form.Label>Status:</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="Status"
                                        value={formData.Status}
                                        onChange={handleChange}
                                    >
                                        <option value="None">None</option>
                                        <option value="A new issue">A new issue</option>
                                        <option value="Resolved">Resolved</option>
                                    </Form.Control>
                                </Form.Group>
                            )}
                            {formData.Type !== "Bug" && (
                                <Form.Group controlId="formSize">
                                    <Form.Label>Size:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="Size"
                                        value={formData.Size}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            )}
                            <Form.Group controlId="formSummary">
                                <Form.Label>Summary:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows="3"
                                    name="Summary"
                                    value={formData.Summary}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                            <Form.Group controlId="formDescription">
                                <Form.Label>Description:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows="3"
                                    name="Summary"
                                    value={formData.Description}
                                    onChange={handleChange}
                                />
                            </Form.Group> */}
                        {/* <Button variant="primary" type="Submit">Submit</Button> */}
                    </Form>
                </Col>
            </Row>
        </Container>
    )
    }
}   

export default JiraForm;