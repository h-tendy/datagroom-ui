// Top Navigation
import React, { Component } from 'react'
import TopNavBar from '../components/TopNavBar'
import UserMenuItem from './UserMenuItem'

class Top extends Component {
  render () {
    const { user, toggleCb, needMargin} = this.props;
    return (
      <div className={ needMargin ? "top_nav" : "" }>
        <div className="nav_menu">
          <nav>
            <div className="nav toggle">
              <a href="##" id="menu_toggle" onClick={ toggleCb }><i className="fas fa-bars"></i></a>
            </div>
            <TopNavBar>
              <UserMenuItem user={ user }/>
            </TopNavBar>
          </nav>
        </div>
      </div>
    )
  }
}

export default Top