import React, { Component } from 'react'

class Footer extends Component {
  render () {
    const { needMargin } = this.props;
    return (
      <footer style={!needMargin ? { 'margin-left': '0px' } : null}>
        <div className="text-center">
          </div>
          <div className="clearfix"></div>
        </footer>
    )
  }
}

export default Footer