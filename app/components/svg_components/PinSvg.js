import React, { Component } from 'react';
import { PanResponder, Animated } from 'react-native';
// import { Icon } from 'react-native-elements';
import { roundTo } from '../../lib/numberHelpers';
import PropTypes from 'prop-types';
import realm from '../../database/realm';
import { WHITE, GREEN, SECONDARY_BLUE, BLACK_GRAY } from './../../resources/styles/globals';
import { G, Circle, Rect, Text } from 'react-native-svg';

const DELAY = 750;
const DOUBLE_TAP = 300;

class PinSvg extends Component {
  constructor(props) {
    super(props);

    const cleanedCoordinates = props.pin.coordinate.replace(/[\])}[{(]/g, '').split(',');
    const coordinates = { x: cleanedCoordinates[0], y: cleanedCoordinates[1] };

    this.state = {
      pin: props.pin,
      coordinates,
      pan: new Animated.ValueXY(),
      deleteTimeReached: false,
      isActive: props.isActive,
      prevProps: {}
    };

    // Set Touch Functionality
    this.showDeleteButton = false;
    this.lastRelease = 0;
    this.svgPress = false;

    // Set PanResponder Functions. IE moving the SVG
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e, gesture) => {
        if (this.state.isActive) {
          this.svgPress = true;
          this.showDeleteButton = false;
          props.setScrollEnabled();
          this.startDelayCounter();
        } else {
          this.props.updateCurrentPin(this.state.pin.mobile_id);
        }
      },
      onPanResponderMove: (e, gesture) => {
        if (this.state.deleteTimeReached) { return; }
        if (!this.state.isActive) { return; }

        if (
          (e.nativeEvent.locationY) >= props.touchHeight ||
          (e.nativeEvent.locationY) <= 0 ||
          (e.nativeEvent.locationX) >= props.touchWidth ||
          (e.nativeEvent.locationX) <= 0
        ) {
          console.log('trying to move out of bounds');
        } else {
          clearInterval(this.interval);
          this.setState({ deleteTimeReached: false });
          this.showDeleteButton = false;
          this.setState({
            coordinates: {
              x: (e.nativeEvent.locationX / props.touchWidth) * 100,
              y: (e.nativeEvent.locationY / props.touchHeight) * 100,
            },
          });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        const { pin, deleteTimeReached, coordinates } = this.state;
        const now = e.timeStamp;
        props.setScrollEnabled();

        // Long Tap Hold
        if (deleteTimeReached && this.state.isActive) {
          this.showDeleteButton = true;

          // Double Tap
        } else if (now - this.lastRelease < DOUBLE_TAP) {
          if (pin.pinnable_type == 'Area') {
            this.props.changeEditingArea(pin.pinnable);
          } else if (pin.pinnable_type == 'ExistingFixture') {
            this.props.editAreaProduct(pin.pinnable);
          } else if (pin.pinnable_type == 'Attachment') {
            this.props.changeEditingArea(pin.pinnable.attachable);
          }
        }

        // Draging Pin
        else if (this.state.isActive) {
          realm.write(() => {
            pin.coordinate = `(${roundTo(coordinates.x, 2)},${roundTo(coordinates.y, 2)})`;
            realm.create('Pin', pin, true);
            pin.pinnable.edited = true;
          });
        }

        clearInterval(this.interval);
        this.setState({ deleteTimeReached: false });
        this.svgPress = false;
        this.lastRelease = e.timeStamp;
      },
    });
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevProps = prevState.prevProps || {};
    const isActive = prevProps.isActive != nextProps.isActive ? nextProps.isActive : prevState.isActive;

    if (nextProps.isActive == prevProps.isActive) {
      return { prevProps: nextProps }
    } else {
      return { prevProps: nextProps, ...prevState, isActive }
    }
  }

  deriveColors() {
    const { isActive } = this.state;

    return isActive ? {
      strokeColor: SECONDARY_BLUE,
      textColor: SECONDARY_BLUE,
    } : {
      strokeColor: GREEN,
      textColor: BLACK_GRAY,
    };
  }

  startDelayCounter() {
    if (!this.state.isActive) { return; }
    let tick = 0;
    this.interval = setInterval(() => {
      tick += 1;
      if (tick == 1) {
        this.setState({ deleteTimeReached: true });
      }
    }, DELAY);
  }

  async deletePin() {
    await this.state.pin.deactivate();
    this.props.updateCurrentPin(this.state.pin.mobile_id);
  }

  renderDeleteButton() {
    const { coordinates } = this.state;
    const { iconSizeMultiplier, zoomScale } = this.props;

    // Compute absolute pixel center of the pin
    const cx = this.getXCoordinate(coordinates.x)
    const cy = this.getYCoordinate(coordinates.y)

    // Counter-scale transform (keeps size consistent relative to pin)
    const invScale = 1 / (zoomScale || 1);
    const centerTransform = `translate(${cx},${cy}) scale(${invScale}) translate(${-cx},${-cy})`;

    const pinRadius = 24 * iconSizeMultiplier;

    return (
      <G transform={centerTransform} onPress={() => this.deletePin()}>
        <Circle
          cx={cx + pinRadius}
          cy={cy - pinRadius}
          r={12 * iconSizeMultiplier}
          fill="tomato"
        />
        <Text
          x={cx + pinRadius}
          y={cy - pinRadius}
          fill={WHITE}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize={18 * iconSizeMultiplier}
          fontWeight="bold"
        >x</Text>
      </G>
    );
  }

  getIlluminanceText() {
    let attributes = JSON.parse(this.state.pin.pinnable.custom_attributes);
    let pinnableSubType = this.state.pin.pinnable_sub_type;
    if (attributes.hasOwnProperty(pinnableSubType)) {
      return attributes[pinnableSubType];
    } else {
      return '';
    }
  }

  getXCoordinate(xCoordinate) {
    return (xCoordinate / 100) * this.props.touchWidth;
  }

  getYCoordinate(yCoordinate) {
    return (yCoordinate / 100) * this.props.touchHeight;
  }

  render() {
    const { pin, coordinates, deleteTimeReached } = this.state;
    const { iconSizeMultiplier } = this.props;

    const cx = this.getXCoordinate(coordinates.x);
    const cy = this.getYCoordinate(coordinates.y);
    const zoomScale = this.props.zoomScale || 1;
    const invScale = 1 / zoomScale;
    const centerTransform = `translate(${cx}, ${cy}) scale(${invScale}) translate(${-cx}, ${-cy})`;

    const {
      strokeColor,
      textColor,
    } = this.deriveColors();

    return (
      <G>
        <G {...this.panResponder.panHandlers}>

          <G transform={centerTransform}>
            {(pin.pinnable_type == 'Area' && pin.pinnable_sub_type == 'location') &&
              <G>
                <Rect
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={WHITE}
                  fillOpacity={(!!this.svgPress || !!this.showDeleteButton) ? 1 : 0.70}
                  width={deleteTimeReached ? (50 * iconSizeMultiplier) * 1.25 : (50 * iconSizeMultiplier)}
                  height={deleteTimeReached ? (50 * iconSizeMultiplier) * 1.25 : (50 * iconSizeMultiplier)}
                  strokeWidth={deleteTimeReached ? 3.25 * iconSizeMultiplier : (3 * iconSizeMultiplier)}
                  stroke={strokeColor}
                  transform={{ x: deleteTimeReached ? (-25 * iconSizeMultiplier) * 1.25 : (-25 * iconSizeMultiplier), y: deleteTimeReached ? (-25 * iconSizeMultiplier) * 1.25 : (-25 * iconSizeMultiplier) }}
                />
                <Text
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={textColor}
                  textAnchor={'middle'}
                  alignmentBaseline={'middle'}
                  fontSize={20 * iconSizeMultiplier}
                  fontWeight={'bold'}
                  transform={{ x: 0, y: -15 * iconSizeMultiplier }}
                  dy="0.85em"
                >{pin.pinnable.code}</Text>
              </G>
            }

            {(pin.pinnable_type == 'Area' && pin.pinnable_sub_type != 'location') &&
              <G>
                {/* {[0, 90].map((degree) => (
                <G
                  key={degree}
                  transform={{
                    rotate: degree,
                    originX: this.getXCoordinate(coordinates.x),
                    originY: this.getYCoordinate(coordinates.y),
                  }}
                >
                  <Rect
                    x={`${coordinates.x}%`}
                    y={`${coordinates.y}%`}
                    fill={this.strokeColor}
                    width={!!deleteTimeReached ? (4 * iconSizeMultiplier) * 1.25 : (4 * iconSizeMultiplier)}
                    height={!!deleteTimeReached ? (40 * iconSizeMultiplier) * 1.25 : (40 * iconSizeMultiplier)}
                    transform={{x: !!deleteTimeReached ? (-2 * iconSizeMultiplier) * 1.25 : (-2 * iconSizeMultiplier), y: !!deleteTimeReached ? (-20 * iconSizeMultiplier) * 1.0 : (-20 * iconSizeMultiplier)}}
                  />
                </G>
              ))} */}
                <Rect
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={strokeColor}
                  width={deleteTimeReached ? (4 * iconSizeMultiplier) * 1.25 : (4 * iconSizeMultiplier)}
                  height={deleteTimeReached ? (40 * iconSizeMultiplier) * 1.25 : (40 * iconSizeMultiplier)}
                  transform={{ x: deleteTimeReached ? (-2 * iconSizeMultiplier) * 1.25 : (-2 * iconSizeMultiplier), y: deleteTimeReached ? (-20 * iconSizeMultiplier) * 1.0 : (-20 * iconSizeMultiplier) }}
                />
                <Rect
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={strokeColor}
                  width={deleteTimeReached ? (40 * iconSizeMultiplier) * 1.25 : (40 * iconSizeMultiplier)}
                  height={deleteTimeReached ? (4 * iconSizeMultiplier) * 1.25 : (4 * iconSizeMultiplier)}
                  transform={{ x: deleteTimeReached ? (-20 * iconSizeMultiplier) * 1.25 : (-20 * iconSizeMultiplier), y: deleteTimeReached ? (-2 * iconSizeMultiplier) * 1.0 : (-2 * iconSizeMultiplier) }}
                />
                <Circle
                  cx={this.getXCoordinate(coordinates.x)}
                  cy={this.getYCoordinate(coordinates.y)}
                  r={deleteTimeReached ? (15 * iconSizeMultiplier) * 1.25 : 15 * iconSizeMultiplier}
                  fill={WHITE}
                  strokeWidth={deleteTimeReached ? 3.25 * iconSizeMultiplier : (3 * iconSizeMultiplier)}
                  stroke={strokeColor}
                />
                <Text
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={textColor}
                  textAnchor={'middle'}
                  alignmentBaseline={'middle'}
                  transform={{ x: -1, y: -9.5 * iconSizeMultiplier }}
                  fontSize={12 * iconSizeMultiplier}
                  fontWeight={'bold'}
                  dy="0.85em"
                >{this.getIlluminanceText()}</Text>
              </G>
            }

            {pin.pinnable_type == 'ExistingFixture' &&
              <G>
                <Circle
                  cx={this.getXCoordinate(coordinates.x)}
                  cy={this.getYCoordinate(coordinates.y)}
                  r={deleteTimeReached ? (20 * iconSizeMultiplier) * 1.25 : 20 * iconSizeMultiplier}
                  fill={WHITE}
                  fillOpacity={(!!this.svgPress || !!this.showDeleteButton) ? 1 : 0.70}
                  strokeWidth={deleteTimeReached ? 3.25 * iconSizeMultiplier : (3 * iconSizeMultiplier)}
                  stroke={pin.pinnable.audit_complete || this.state.isActive ? strokeColor : 'tomato'}
                />
                <Text
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={pin.pinnable.audit_complete || this.state.isActive ? textColor : 'tomato'}
                  textAnchor={'middle'}
                  alignmentBaseline={'middle'}
                  fontSize={18 * iconSizeMultiplier}
                  fontWeight={'bold'}
                  transform={{ x: -1, y: -13 * iconSizeMultiplier }}
                  dy="0.75em"
                  dx="0.06em"
                >{pin.pinnable.code}</Text>
              </G>
            }

            {pin.pinnable_type == 'Attachment' &&
              <G>
                <Rect
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={strokeColor}
                  strokeWidth={deleteTimeReached ? 3.25 * iconSizeMultiplier : (3 * iconSizeMultiplier)}
                  stroke={strokeColor}
                  // fill={WHITE}
                  fillOpacity={(!!this.svgPress || !!this.showDeleteButton) ? 1 : 0.70}
                  width={deleteTimeReached ? (40 * iconSizeMultiplier) * 1.25 : (40 * iconSizeMultiplier)}
                  height={deleteTimeReached ? (30 * iconSizeMultiplier) * 1.25 : (30 * iconSizeMultiplier)}
                  transform={{ x: deleteTimeReached ? (-20 * iconSizeMultiplier) * 1.25 : (-20 * iconSizeMultiplier), y: deleteTimeReached ? (-15 * iconSizeMultiplier) * 1.25 : (-15 * iconSizeMultiplier) }}
                />
                <Rect
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={strokeColor}
                  strokeWidth={deleteTimeReached ? 3.25 * iconSizeMultiplier : (3 * iconSizeMultiplier)}
                  stroke={strokeColor}
                  width={deleteTimeReached ? (10 * iconSizeMultiplier) * 1.25 : (10 * iconSizeMultiplier)}
                  height={deleteTimeReached ? (5 * iconSizeMultiplier) * 1.25 : (5 * iconSizeMultiplier)}
                  transform={{ x: deleteTimeReached ? (10 * iconSizeMultiplier) * 1.25 : (10 * iconSizeMultiplier), y: deleteTimeReached ? (-20 * iconSizeMultiplier) * 1.25 : (-20 * iconSizeMultiplier) }}
                />
                <Circle
                  cx={this.getXCoordinate(coordinates.x)}
                  cy={this.getYCoordinate(coordinates.y)}
                  r={deleteTimeReached ? (4 * iconSizeMultiplier) * 1.25 : 4 * iconSizeMultiplier}
                  fill={textColor}
                />
                <Circle
                  cx={this.getXCoordinate(coordinates.x)}
                  cy={this.getYCoordinate(coordinates.y)}
                  r={deleteTimeReached ? (8 * iconSizeMultiplier) * 1.25 : 7 * iconSizeMultiplier}
                  fillOpacity={0}
                  strokeWidth={deleteTimeReached ? 1.75 * iconSizeMultiplier : (1.5 * iconSizeMultiplier)}
                  stroke={textColor}
                />
                <Rect
                  x={this.getXCoordinate(coordinates.x)}
                  y={this.getYCoordinate(coordinates.y)}
                  fill={textColor}
                  width={deleteTimeReached ? (5 * iconSizeMultiplier) * 1.25 : (5 * iconSizeMultiplier)}
                  height={deleteTimeReached ? (4 * iconSizeMultiplier) * 1.25 : (4 * iconSizeMultiplier)}
                  transform={{ x: deleteTimeReached ? (-15 * iconSizeMultiplier) * 1.25 : (-15 * iconSizeMultiplier), y: deleteTimeReached ? (-10 * iconSizeMultiplier) * 1.25 : (-10 * iconSizeMultiplier) }}
                />

              </G>
            }
          </G>

        </G>

        {this.showDeleteButton &&
          this.renderDeleteButton()
        }

      </G>
    );
  }
}

PinSvg.propTypes = {
  pin: PropTypes.object.isRequired,
  iconSizeMultiplier: PropTypes.number.isRequired,
  touchHeight: PropTypes.number.isRequired,
  touchWidth: PropTypes.number.isRequired,
  setScrollEnabled: PropTypes.func.isRequired,
  updateCurrentPin: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
  zoomScale: PropTypes.number.isRequired,
};

export default PinSvg;
