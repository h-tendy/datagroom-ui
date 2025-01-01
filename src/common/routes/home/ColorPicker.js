import React from 'react'
import { SketchPicker, /* ChromePicker, GithubPicker, PhotoshopPicker, CompactPicker, SwatchesPicker */ } from 'react-color'

class ColorPicker extends React.Component {

  render() {
    let { left, top, color, handleClose, onChangeComplete } = this.props;
    console.log("left, top: ", left, top);
    const popover = {
      position: 'absolute',
      zIndex: 2,
      left,
      top
    }
    const cover = {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    }
    return (
      <div>
        <div style={ popover }>
          <div style={ cover } onClick={ handleClose }/>
          <SketchPicker color={ color } onChangeComplete={ onChangeComplete }/>
        </div>
      </div>
    )
  }
}

export default ColorPicker