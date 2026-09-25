import React, { Component } from 'react';
import PropTypes from 'prop-types';
import realm from '../../database/realm';
// import { GS, WHITE, LIGHT_GREEN } from 'RetroluxMobile/app/resources/styles/globals';
import { roundTo } from '../../lib/numberHelpers';
import { Area } from '../../database/models';
import { PinSvg } from '../';
import { G } from 'react-native-svg';

class LayerSvg extends Component {
  constructor(props) {
    super(props);
    const layer = props.layer;
    const pins = layer.pins;

    this.state = {
      layer,
      pins,
    };
  }

  deriveIsActivePin(pin, currentPin) {
    if (!currentPin.pinnable) {
      return false;
    }
    const keysToCheck = ['mobile_id', 'pinnable_type', 'pinnable_sub_type'];

    const unequalKeyIndex = keysToCheck.findIndex(key => pin.pinnable[key] != currentPin.pinnable[key]);

    // if all keys are equal
    if (unequalKeyIndex === -1) {
      return true;
    }

    return false;
  }

  render() {
    const {
      currentPin,
      touchWidth,
      touchHeight,
      iconSizeMultiplier,
      setScrollEnabled,
      changeEditingArea,
      editAreaProduct,
      updateCurrentPin,
      zoomScale,
      visibility,
      layer,
    } = this.props;
    return (
      <G>
        {visibility[layer.layer_type] &&
          this.state.pins.map((pin) => {
            const isActive = this.deriveIsActivePin(pin, currentPin);
            return (
              <PinSvg
                key={pin.mobile_id}
                pin={pin}
                iconSizeMultiplier={iconSizeMultiplier}
                touchHeight={touchHeight}
                touchWidth={touchWidth}
                setScrollEnabled={setScrollEnabled}
                isActive={isActive}
                changeEditingArea={changeEditingArea}
                editAreaProduct={editAreaProduct}
                updateCurrentPin={updateCurrentPin}
                zoomScale={zoomScale}
              />
            );
          })
        }

      </G>
    );
  }
}

LayerSvg.propTypes = {
  currentPin: PropTypes.object.isRequired,
  layer: PropTypes.object.isRequired,
  zoomScale: PropTypes.number.isRequired,
  touchHeight: PropTypes.number.isRequired,
  touchWidth: PropTypes.number.isRequired,
  iconSizeMultiplier: PropTypes.number.isRequired,
  setScrollEnabled: PropTypes.func.isRequired,
  changeEditingArea: PropTypes.func.isRequired,
  editAreaProduct: PropTypes.func.isRequired,
  updateCurrentPin: PropTypes.func.isRequired,
  visibility: PropTypes.object.isRequired,
};

export default LayerSvg;
