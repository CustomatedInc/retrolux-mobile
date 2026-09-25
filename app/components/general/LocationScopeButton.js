import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Alert, ScrollView } from 'react-native';
import { truncateString } from '../../lib/numberHelpers';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import realm from '../../database/realm';
// import { GS, DARKER_GRAY, BLACK_GRAY } from 'RetroluxMobile/app/resources/styles/globals';

class LocationScopeButton extends Component {
  constructor(props) {
    super(props);
  }

  renderLocationNames(locations) {
    names = []
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];

      if (i == 0) {
        names.push( <Text key={location.mobile_id} style={{ color: '#5f4703' }}>{truncateString(location.name, 30)}</Text> )
      } else {
        names.push( <Icon key={`icon-${location.mobile_id}`} name="circle" color={'#5f4703'} iconStyle={{marginLeft: 7.5}} size={7.5} type={'font-awesome'} /> )
        names.push( <Text key={location.mobile_id} style={{ color: '#5f4703', marginLeft: 7.5 }}>{truncateString(location.name, 30)}</Text> )
      }
      
    }
    return names;
  }

  render() {
    const { project } = this.props

    return (
      <View>
        {project.scoped_locations.length > 0 &&
          <View style={styles.holder}>
            <ScrollView
                horizontal
                style={{ flex: 1, flexBasis: '95%' }}
                contentContainerStyle={styles.locationNames}
                showsHorizontalScrollIndicator={false}
              >
              {this.renderLocationNames(project.scoped_locations)}
            </ScrollView>
            <TouchableOpacity style={{flexBasis:'5%'}} onPress={() => Alert.alert('Showing Specific Location Data Only', 'Only showing audit data tied to these locations. To manage, go to your locations list.')}>
              <Icon name="info-circle" color={'#5f4703'} size={20} type={'font-awesome'} />
            </TouchableOpacity>
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  holder : {
    backgroundColor: '#fff2cc',
    paddingHorizontal: 20,
    paddingVertical: 5,
    flexDirection: 'row'
  },

  locationNames: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row'
  }

});

LocationScopeButton.propTypes = {
  project: PropTypes.object.isRequired,
};

export default LocationScopeButton;
