import React, { Component } from 'react'
import { Item } from '../components/TopNavBar'
import { userActions } from '../actions';

class UserMenuItem extends Component {
  constructor(props){
    super(props);
    this.logout = this.logout.bind(this);
  }

  logout(){
    const { dispatch } = this.props;
    dispatch(userActions.logout());
  }

  render() {
    const { user } = this.props;
    return (
      <Item {...this.props}>
        <Item.Content className="user-profile">
          {/*<img src={user.userphoto} alt=""/>*/}{user.user}
          <span className=" fa fa-angle-down"></span>
        </Item.Content>
        <Item.SubMenu className="dropdown-usermenu pull-right">
          <li><a href="#!"> Profile</a></li>
          <li>
            <a href="#!">
              <span className="badge bg-red pull-right">50%</span>
              <span>Settings</span>
            </a>
          </li>
          <li><a href="#!">Help</a></li>
          <li><a href="/" onClick={this.logout}><i className="fa fa-sign-out pull-right"></i> Log Out</a></li>
        </Item.SubMenu>
      </Item>
    )
  }
}

export default UserMenuItem
