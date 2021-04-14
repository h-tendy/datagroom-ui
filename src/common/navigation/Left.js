import React, { Component } from 'react'
// import { Link } from 'react-router-dom'

class Left extends Component {
  render() {
    const { user, visible } = this.props;
    if (!visible) 
      return (<div></div>);
    return (
      <div className="col-md-3 left_col">
        <div className="left_col scroll-view">
          <div className="navbar nav_title" style={ { border: 0 } }>
            <a href="/" className="site_title"><span>Datagroom</span></a>
          </div>

          <div className="clearfix"></div>

          { /* menu profile quick info */ }
          <div className="profile clearfix">
            {/*
            <div className="profile_pic">
            <img src={user.userphoto} alt="..." className="img-circle profile_img"/>
            </div>
            */}
            <div className="profile_info">
              <span>Welcome,</span>
              <h5 style= {{ color: "white" }}>{user.user}</h5>
            </div>
          </div>
          { /* /menu profile quick info */ }

          <br/>

          { /* sidebar menu */ }
          { this.props.children }
          <div className="sidebar-footer hidden-small">
            <a href="##" data-toggle="tooltip" data-placement="top" title="Settings">
              <span className="glyphicon glyphicon-cog" aria-hidden="true"></span>
            </a>
            <a href="##" data-toggle="tooltip" data-placement="top" title="FullScreen">
              <span className="glyphicon glyphicon-fullscreen" aria-hidden="true"></span>
            </a>
            <a href="##" data-toggle="tooltip" data-placement="top" title="Lock">
              <span className="glyphicon glyphicon-eye-close" aria-hidden="true"></span>
            </a>
            <a data-toggle="tooltip" data-placement="top" title="Logout" href="login.html">
              <span className="glyphicon glyphicon-off" aria-hidden="true"></span>
            </a>
          </div>
        </div>
      </div>
    )
  }
}


export default Left
