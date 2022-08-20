import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap'

class ModalWrapper extends React.Component {
  render() {
    // Render nothing if the "show" prop is false
    if(!this.props.show) {
      return null;
    }
    // The gray background
    const backdropStyle = {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 50
  
    };
  
      // The modal "window"
    const modalStyle = {
        backgroundColor: '#fff',
        borderRadius: 5,
        maxWidth: 600,
        /*minHeight: 300,*/
        margin: '0 auto',
        padding: 30
    };
    const bodyStyle = {
      height: 250,
      overflowY: 'auto'
    }
    return (
        <div style={ backdropStyle }>
            <div style={ modalStyle }>
            <Modal.Header>
                <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <div style={ bodyStyle }>
              <Modal.Body>{this.props.children}</Modal.Body>
            </div>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => this.props.onClose(false)}>
                    {this.props.cancel ? this.props.cancel : "Cancel"}
                </Button>
                <Button variant="primary" onClick={() => this.props.onClose(true)}>
                    {this.props.ok ? this.props.ok: "Do It!"}
                </Button>
            </Modal.Footer>
            </div>
      </div>        
    );
  }
}

ModalWrapper.propTypes = {
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  children: PropTypes.node
};

export default ModalWrapper;