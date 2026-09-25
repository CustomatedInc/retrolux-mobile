import React, { Component } from 'react';
import { ScrollView, View, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import realm from '../database/realm';

import { formatLargeNumber } from '../lib/numberHelpers';
import { dateString } from '../lib/dateHelpers';
import { Location } from '../database/models';
import { GS, PRIMARY_BLUE, GREEN } from '../resources/styles/globals';
import { bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import * as Actions from '../actions';
import store from '../store';

import {
  DeleteButton,
  EditButton,
  CopyButton,
  RLButton,
  EmptyMessage,
  TableActionBar,
  TableCell,
  TableHeader,
  TableRow,
  SearchBar,
  LocationScopeButton,
} from '../components';

class Locations extends Component {
  constructor(props) {
    super(props);

    const locations = props.project.locations;
    this.state = {
      locations,
      loadingSpinner: false,
    };

    this.locationsListener = this.locationsListener.bind(this);
    this.setLocationScope = this.setLocationScope.bind(this);
    this.confirmDeactivation = this.confirmDeactivation.bind(this);
  }

  componentDidMount() {
    realm.addListener('change', this.locationsListener);
  }

  componentWillUnmount() {
    realm.removeAllListeners();
  }

  locationsListener() {
    const locations = this.props.project.locations;
    this.setState({ locations });
  }

  setLocationScope(locationId) {
    const { project } = this.props
    realm.write(() => {
      if (project.mobile_location_scope_ids.indexOf(locationId) != -1) { // already exists -> remove
        project.mobile_location_scope_ids = project.mobile_location_scope_ids.filter(item => item !== locationId)
      } else {
        project.mobile_location_scope_ids.push(locationId);
        this.props.changeSidebarTab(4);
      }
    })
  }

  async copyLocation(location) {
    this.setState({ loadingSpinner: true });
    await location.createCopy();
    this.setState({ loadingSpinner: false });
  }

  async deactivateLocation(location) {
    const { project } = this.props
    await this.setState({ loadingSpinner: true });

    // to clear out id from project.mobile_location_scope_ids
    if (project.mobile_location_scope_ids.indexOf(location.mobile_id) != -1) { // already exists -> remove
      realm.write(() => { 
        project.mobile_location_scope_ids = project.mobile_location_scope_ids.filter(item => item !== location.mobile_id)
      })
    }
    // setTimeout is so loadingSpinner displays
    setTimeout(() => {
      location.deactivate();
      this.setState({ loadingSpinner: false });
    }, 100);
  }

  confirmDeactivation(location) {
    let subMessage = 'You cannot undo this action. ';
    if (location.areas.length > 0) { subMessage += 'You are also deleting ALL AREAS tied to this location'; }

    const buttons = [
      { text: 'Yes, delete it.', onPress: () => { this.deactivateLocation(location); }, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Are You Sure?', subMessage, buttons, { cancelable: false });
  }

  setHeaderCells() {
    const headerCells = [
      { flex: 1, title: ''},
      { flex: 1, title: 'Complete', textAlign: 'center'},
      { flex: 5.5, title: 'Name' },
      { flex: 3, title: 'Created At' },
      { flex: 1, title: 'Copy', textAlign: 'center' },
      { flex: 1, title: 'Delete', textAlign: 'center' },
    ];

    return headerCells;
  }

  renderRows(locations) {
    const { project } = this.props;

    if (locations.length < 1) {
      return (
        <View style={{ borderTopColor: 'lightgrey', flex: 1 }}>
          <EmptyMessage
            header={'No locations Yet'}
            message={'Press the "+ location" button above to create one'}
          />
        </View>
      );
    }
    let rows = [];
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];

      rows.push(
        <TableRow
          bottomBorder
          onPressRow={() => this.props.changeStack('location_form', location.mobile_id)}
          altColor={false}
          key={location.mobile_id}
        >
          <TableCell flex={1} alignItems="center" >
            <TouchableOpacity
              onPress={() => this.setLocationScope(location.mobile_id)}
              style={{...GS.center, flex: 1, width: '100%'}}
            >
              {project.mobile_location_scope_ids.indexOf(location.mobile_id) != -1 &&
                <Icon name="circle" color={PRIMARY_BLUE} size={30} type={'font-awesome'} />
              }
              {project.mobile_location_scope_ids.indexOf(location.mobile_id) == -1 &&
                <Icon name="circle-o" color={PRIMARY_BLUE} size={30} type={'font-awesome'} />
              }
            </TouchableOpacity>
          </TableCell>
          <TableCell type="icon" flex={1} alignItems="center">
            <Icon
              name={location.audit_complete ? 'check-circle' : 'times-circle'}
              iconStyle={{ color: location.audit_complete ? GREEN : 'tomato' }}
              size={20}
              type={'font-awesome'}
            />
          </TableCell>
          <TableCell type="text" flex={5.5} text={location.name} />
          <TableCell type="text" flex={3} text={dateString(location.created_at)} />
          <TableCell flex={1} alignItems="center">
            <CopyButton onPress={() => project.premiumAccount ? this.copyLocation(location) : Alert.alert('Plan Upgrade Required', 'To unlock multi-location audits, please reach out to support@retrolux.com.')} />
          </TableCell>
          <TableCell flex={1} alignItems="center">
            <DeleteButton onPress={() => project.locations.length > 1 ? this.confirmDeactivation(location) : Alert.alert("Projects need at least one location.")} />
          </TableCell>
        </TableRow>,
      );
    }

    return (
      <ScrollView>
        { rows }
      </ScrollView>
    );
  }

  render() {
    const { locations } = this.state
    const { project } = this.props
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <LocationScopeButton
          project={project}
        />
        <TableActionBar>
          <View style={{ flex: 6 }}>
            {/* <SearchBar
              // value={this.projectDefaults.areasSearchText}
              onChangeText={text => this.searchAreas(text)}
              onClear={() => this.clearSearch()}
              placeholder="search for an area"
            /> */}
          </View>
          <View style={{ flex: 1 }}>
            <RLButton
              title="+ location"
              onPress={() => project.premiumAccount || project.locations.length < 1 ? this.props.changeStack('location_form') : Alert.alert('Plan Upgrade Required', 'To unlock multi-location audits, please reach out to support@retrolux.com.')}
              buttonStyle={{ flex: 1 }}
            />
          </View>
        </TableActionBar>

        {this.state.loadingSpinner &&
          <View style={{ flex: 15, justifyContent: 'center', alignItems: 'center'}} >
            <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          </View>
        }

        {!this.state.loadingSpinner &&
          <View style={{ flex: 15 }}>
            <TableHeader headerCells={this.setHeaderCells()} />
            <View style={{ flex: 1 }}>
              {this.renderRows(locations)}
            </View>
          </View>
        }

      </View>
    );
  }
}

Locations.propTypes = {
  changeStack: PropTypes.func.isRequired,
  changeSidebarTab: PropTypes.func.isRequired,
  project: PropTypes.shape({
    mobile_id: PropTypes.number.isRequired,
  }).isRequired,
};


function mapStateToProps(state, props) {
  return {
    projectDefaults: state.currentUserReducer.projectDefaults,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Locations);
