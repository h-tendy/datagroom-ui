import React, { Component } from 'react'
import Home from './home'


class PageContent extends Component {
  render() {
    const { needMargin } = this.props;
    return (
      <div className={needMargin ? "right_col" : "right_col_noPanel"} role="main">
        {Home}
      </div>
    )
  }
}

export default PageContent
