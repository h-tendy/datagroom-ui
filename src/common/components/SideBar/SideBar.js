import React, { Component } from 'react'
// import { matchPath } from 'react-router'
import SharedState from '../SharedState'
import MenuSection from './MenuSection'
import GroupMenuItem from './GroupMenuItem'
import MenuItem from './MenuItem'

const childrenWithProps = (children, props) => React.Children.map(children, c => React.cloneElement(c, props))

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.shared = SharedState(this, {
      setVisiblePath: (path) => {
        console.log(`setVisiblePath: ${path}`);
        this.setState({visiblePath: path});
      }
    })
    this.state = {
      visiblePath: ""
    }
  }

  render() {
    const { children } = this.props

    return (
      <div id="sidebar-menu" className="main_menu_side hidden-print main_menu">
        { childrenWithProps(children, { shared: this.shared }) }
      </div>
    )
  }
}

SideBar.MenuSection = MenuSection
SideBar.GroupMenuItem = GroupMenuItem
SideBar.MenuItem = MenuItem

export default SideBar
