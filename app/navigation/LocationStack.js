import React, { Component } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Locations from '../screens/Locations'
import LocationForm from '../screens/LocationForm';

class LocationStack extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stack: props.stack,
      currentLocationId: null,
    };

    this.changeStack = this.changeStack.bind(this);
  }

  changeStack(newStack, location_mobile_id = null) {
    this.setState({
      stack: newStack,
      currentLocationId: location_mobile_id
    });
  }

  render() {
    const { currentLocationId, stack } = this.state;
    const project = this.props.project;

    switch (stack) {
      case 'locations':
        return (
          <View style={{ flex: 1 }}>
            <Locations
              changeStack={this.changeStack}
              changeSidebarTab={this.props.changeSidebarTab}
              project={project}
            />
          </View>
        );

      case 'location_form':
        return (
          <View style={{ flex: 1 }}>
            <LocationForm
              currentLocationId={currentLocationId}
              changeStack={this.changeStack}
              changeSidebarTab={this.props.changeSidebarTab}
              project={project}
            />
          </View>
        );

      default:
        return <View />;
    }
  }
}

LocationStack.propTypes = {
  project: PropTypes.shape({ mobile_id: PropTypes.number.isRequired }).isRequired,
  changeSidebarTab: PropTypes.func.isRequired,
  stack: PropTypes.string.isRequired,
};

export default LocationStack;
