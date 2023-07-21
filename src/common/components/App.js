import React, { Component } from 'react';
import { Left, Top, Footer } from '../navigation';
import PageContent, { Menu } from '../routes';
import { connect } from 'react-redux';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leftVisible: false
    };
    this.toggleLeft = this.toggleLeft.bind(this);
  }
  toggleLeft() {
    this.setState({
      leftVisible: !this.state.leftVisible
    });
  }
  render() {
    const { user } = this.props;
    const { leftVisible } = this.state;
    // In Top, need to remove top_nav class (or make up one more without the margin)
    // In PageContent, remove right_col class (or alternate class)
    // Or check @media (max-width: 991px) in xtend.css
    return (
      <div className="container body">
        <div className="main_container">
          <Left user={user} visible={leftVisible}>
            {Menu}
          </Left>
          <Top user={user} toggleCb={this.toggleLeft} needMargin={leftVisible} {...this.props} />
          <PageContent needMargin={leftVisible} />
          <Footer needMargin={leftVisible} />
        </div>
      </div>
    );
  }
}
function mapStateToProps(state) {
  const { user } = state.authentication;
  return {
    user
  }
}

const connectedApp = connect(mapStateToProps)(App);

export default connectedApp;