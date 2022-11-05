import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap'
//import './codemirror.css';

class ModalEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: "",
            textareaRef: null
        }
    }
	componentDidMount () {
        if (this.codeMirror) {
            this.codeMirror.focus();
        }
	}
	componentWillUnmount () {
    }

  render() {
    let me = this;
    // Render nothing if the "show" prop is false
    if(!this.props.show) {
        // is there a lighter-weight way to remove the cm instance?
        if (this.codeMirror) {
            let value = this.codeMirror.getValue();
            this.codeMirror.toTextArea();
            this.codeMirror = null;
            this.setState({textareaRef: null, value });
        }
        return null;
    }
    {
        console.log("Ref value: ", this.state.textareaRef);
        if (this.state.textareaRef && !this.codeMirror) {
            this.codeMirror = window.CodeMirror.fromTextArea(this.state.textareaRef, {
                lineNumbers: true,
                lineWrapping: true,
                mode: "spell-checker",
                backdrop: "markdown",
                highlightFormatting: true,
                scrollbarStyle: "null"
            });
            window.inlineAttachment.editors.codemirror4.attach(this.codeMirror, {
                uploadUrl: '/uploadAttachments', 
                urlText: '<img src="{filename}" alt="{filename}" width="100%" height="100%"/>', fileUrlText: '[{filename}]({filename})',
                allowedTypes: '*',
                extraParams: {
                    dsName: this.props.editorParams.dsName
                }
            });
            let h = (this.codeMirror.getDoc().lineCount() + 10) * 18;
            this.codeMirror.setSize("100%", `${h}px`);
            this.codeMirror.scrollIntoView({line: this.codeMirror.getDoc().lineCount() - 1, ch: 0}, 50)
            this.codeMirror.getDoc().setCursor({line: this.codeMirror.getDoc().lineCount() - 1, ch:0});
            //let me = this;
            //setTimeout(me.codeMirror.refresh, 1000);
            this.codeMirror.refresh();
            this.codeMirror.focus();
            if (this.props.cmRef) {
                this.props.cmRef.ref = this.codeMirror;
            }
            this.codeMirror.on("keydown", function (cm, e) {
                switch (e.keyCode) {
                    case 13:
                        if (e.ctrlKey) {
                            me.props.onClose(true, me.codeMirror.getValue())
                        }
                        break;
                    case 27:
                        me.props.onClose(false, me.codeMirror.getValue())
                        break;    
                    default:
                        e.stopImmediatePropagation();
                        e.stopPropagation();        
                        break;    
                }
            });    
        }
    }

    // The gray background
    const backdropStyle = {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 10
  
    };
  
      // The modal "window"
    const modalStyle = {
        backgroundColor: '#fff',
        borderRadius: 5,
        maxWidth: "55%",
        height: "100%",
        margin: '0 auto',
        padding: 5
    };
    const bodyStyle = {
      height: "80%",
      overflowY: 'auto'
    }
    const textareaStyle = {
        // Makes no difference
    }

    return (
        <div style={ backdropStyle }>
            <div style={ modalStyle }>
            <Modal.Header>
                <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <div style={ bodyStyle }>
                <Modal.Body><textarea ref={ref => { 
                                                    if (!me.state.textareaRef)
                                                        me.setState({ textareaRef: ref })
                                                   }} 
                                      style={ textareaStyle } value={ this.props.text } onChange={ (e) => {me.setState({value: e.target.value})} }></textarea></Modal.Body>
            </div>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => me.props.onClose(false, me.codeMirror.getValue())}>
                    {this.props.cancel ? this.props.cancel : "Cancel"}
                </Button>
                <Button variant="primary" onClick={() => me.props.onClose(true, me.codeMirror.getValue())}>
                    {this.props.ok ? this.props.ok: "Do It!"}
                </Button>
            </Modal.Footer>
            </div>
      </div>        
    );
  }
}

ModalEditor.propTypes = {
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  children: PropTypes.node
};

export default ModalEditor;