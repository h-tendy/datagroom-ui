import React from 'react';
import { Alert } from 'react-bootstrap';
import './Notification.css'; // Import your CSS file

/**
 * Use this class to show short lived notifcations on the top right side of screen.
 * Required props are: 
 * show: boolean - Whether to show the notification or not
 * type: string - This is required field. Accepted values are "success", "failure"
 * message: string - Pass the custom message to show to this field.
 * showIcon: boolean - defaults to false, if set true, it shows fa icon tick on success and cross on failure
 * @param {object} props 
 * @returns 
 */
const Notification = (props) => {
    let faIcon = "";
    let message = "";
    if (props.showIcon) {
        if (props.type === "success") {
            faIcon = <i className="fa fa-check"></i>
        } else if (props.type === "failure") {
            faIcon = <i className="fa fa-times"></i>
        }
    }
    if (props.type === "success") {
        message = "SUCCESS..!!";
    } else if (props.type === "failure") {
        message = "FAILURE..!!";
    }
    return (
        <div className={`notification ${props.show ? 'show' : ''} ${props.type}`}>
            {props.show && <Alert transition={false}>
                <span>{props.message ? props.message : message} {faIcon}</span>
            </Alert>}
        </div>
    )
}

export default Notification;
