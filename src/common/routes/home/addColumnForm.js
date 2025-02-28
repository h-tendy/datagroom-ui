import React, { Component } from 'react';
import { Modal, Form } from 'react-bootstrap';

class AddColumnForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columnName: props.columnName || '',
            position: props.position || 'left', // Ensure position syncs with DsView.js
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.columnName !== this.props.columnName) {
            this.setState({ columnName: this.props.columnName });
        }
        if (prevProps.position !== this.props.position) {
            this.setState({ position: this.props.position });
        }
    }

    handlePositionChange = (e) => {
        const newPosition = e.target.value;
        if (this.state.position !== newPosition) {
            this.setState({ position: newPosition });
    
            if (this.props.onPositionChange) {
                this.props.onPositionChange(newPosition); // ✅ Pass updated position to parent
            }
        }
    };
    

    render() {
        const { addColumnError, onChange } = this.props;
        const { columnName, position } = this.state;

        return (
            <div>
                <Modal.Body> 
                    <Form>
                        <Form.Group controlId="columnName">
                            <Form.Label>Column Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={columnName}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    this.setState({ columnName: value });
                                    if (onChange) {
                                        onChange(e);
                                    }
                                }}
                                required
                                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                            />
                            <Form.Text className="text-muted">
                                Column name must start with a letter or underscore
                            </Form.Text>
                        </Form.Group>

                        {/* Position Selection */}
                        <Form.Group>
                            <Form.Label>Position</Form.Label>
                            <div>
                                <Form.Check
                                    type="radio"
                                    label="Left"
                                    name="position"
                                    value="left"
                                    checked={position === "left"}
                                    onChange={this.handlePositionChange}
                                />
                                <Form.Check
                                    type="radio"
                                    label="Right"
                                    name="position"
                                    value="right"
                                    checked={position === "right"}
                                    onChange={this.handlePositionChange}
                                />
                            </div>
                        </Form.Group>

                        {addColumnError && (
                            <div className="alert alert-danger">{addColumnError}</div>
                        )}
                    </Form>
                </Modal.Body>
            </div>
        );
    }
}

export default AddColumnForm;
