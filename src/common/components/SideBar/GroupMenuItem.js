import React, { Component } from 'react'
import cn from 'classnames'
import childrenWithProps from '../childrenWithProps'

class GroupMenuItem extends Component {
  render() {
    /* eslint no-unused-vars: 0 */
    const { icon, title, shared, children, to, isActive, ancestors } = this.props
    const { visiblePath } = shared.getState()
    const chldAncestors = ancestors + " : " + title;
    const active = visiblePath.startsWith(chldAncestors);

    const onClickHdlr = () => {
      visiblePath.startsWith(chldAncestors) ? shared.setVisiblePath(ancestors) : shared.setVisiblePath(chldAncestors);
    }

    return (
      <li className={ cn({ active }) }><a href="##" onClick={ onClickHdlr }>
        { icon ? <i className={ `fas fa-${icon}` }></i> : '' }
        { "  " + title }
        <span className="fas fa-chevron-down pull-right"></span></a>
        <ul className="nav child_menu" style={ { display: active ? 'block' : 'none' } }>
          { childrenWithProps(children, { isActive, shared, ancestors: chldAncestors }) }
        </ul>
      </li>
    )
  }
}

export default GroupMenuItem
