import React, { useState } from "react";
import { Form, Button, Col, Row, Container } from "react-bootstrap";

const JiraForm = (props) => {
    // const [formData, setFormData] = useState({
    //     JIRA_AGILE_ID: "None",
    //     Summary: "",
    //     Size: "",
    //     Type: "Epic",
    //     Status: "None",
    // });
    const [formData, setFormData] = useState({
        ...props.formData
    });

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
        props.handleChange(event)
    };

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <Form>
                        <Form.Group controlId="formJIRA_AGILE_ID">
                            <Form.Label>JIRA AGILE ID:</Form.Label>
                            <Form.Control
                                as="select"
                                name="JIRA_AGILE_ID"
                                value={formData.JIRA_AGILE_ID}
                                onChange={handleChange}
                            >
                                <option value="None">None</option>
                                <option value="THANOS-21364">THANOS-21364</option>
                            </Form.Control>
                        </Form.Group>
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
                        <Form.Group controlId="formSize">
                            <Form.Label>Size:</Form.Label>
                            <Form.Control
                                type="number"
                                name="Size"
                                value={formData.Size}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group controlId="formType">
                            <Form.Label>Type:</Form.Label>
                            <Form.Control
                                as="select"
                                name="Type"
                                value={formData.Type}
                                onChange={handleChange}
                            >
                                <option value="Epic">Epic</option>
                                <option value="User Story">User Story</option>
                                <option value="Sub-task">Sub-task</option>
                                <option value="Bug">Bug</option>
                            </Form.Control>
                        </Form.Group>
                        {formData.Type === "Bug" && (
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
                        {/* <Button variant="primary" type="Submit">Submit</Button> */}
                    </Form>
                </Col>
            </Row>
        </Container>
    )
};

export default JiraForm;