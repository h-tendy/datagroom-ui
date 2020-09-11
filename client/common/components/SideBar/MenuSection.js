import React, { Component } from 'react'
import { Route } from 'react-router-dom'
import { matchPath } from 'react-router'
import cn from 'classnames'
import childrenWithProps from '../childrenWithProps'

const isActive = ({ location }) => (linkTo) => matchPath(location.pathname, {path: linkTo, exact: false, strict: false})

class MenuSection extends Component {
  render () {
    const { title, children, shared } = this.props
    //const { visiblePath } = shared.getState()
    //const active = visiblePath.startsWith(ancestors);
    const ancestors = title;

    return (
      <div className={cn('menu_section', { active: true })}>
        <h3>{title}</h3>
        <Route render={rcp => (
          <ul className="nav side-menu">
            { 
              childrenWithProps(children, { 
                shared,
                isActive: isActive(rcp), 
                ancestors
              })
            }
          </ul>
        )} />
      </div>
    )
  }
}

export default MenuSection