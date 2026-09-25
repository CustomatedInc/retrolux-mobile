import React, { Component } from 'react';
import { ScrollView, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import realm from '../database/realm';

import { truncateString } from '../lib/numberHelpers';
import { dateString } from '../lib/dateHelpers';
import { Area } from '../database/models';
import { GREEN, DARKER_GRAY, PRIMARY_BLUE } from '../resources/styles/globals';
import { bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import * as Actions from '../actions';
import store from '../store';

import {
  DeleteButton,
  CopyButton,
  FloorPlanButton,
  CollapseButton,
  RLButton,
  EmptyMessage,
  TableActionBar,
  TableCell,
  TableHeader,
  TableRow,
  SearchBar,
  LocationScopeButton,
} from '../components';

class Areas extends Component {
  constructor(props) {
    super(props);

    this.project = props.project;
    this.projectDefaults = this.props.projectDefaults[props.project.mobile_id];

    const areas = this.getAreas();
    this.state = {
      areas,
      loadingSpinner: false,
    };

    this.resetAreas = this.resetAreas.bind(this);
  }

  resetAreas() {
    this.setState({ areas: this.getAreas() });
  }

  subAreaViewToggle() {
    const subAreaView = !this.projectDefaults.subAreaView;
    this.props.setProjectDefault(this.project, 'subAreaView', subAreaView);

    this.resetAreas()
  }

  getAreas() {
    if (this.projectDefaults.areasSearchText) {
      areas = Area.search(this.projectDefaults.areasSearchText, this.project);
      areas = areas.length > 0 ? areas.sorted(this.projectDefaults.areasSortByType, this.projectDefaults.areasSortDecending) : [];
    } else if (this.projectDefaults.subAreaView) {
      areas = this.project.openedAreas();
      areas = areas.length > 0 ? areas.sorted(this.projectDefaults.areasSortByType, this.projectDefaults.areasSortDecending) : [];
    } else {
      areas = Area.inProject(this.project);
      areas = areas.length > 0 ? areas.sorted(this.projectDefaults.areasSortByType, this.projectDefaults.areasSortDecending) : [];
    }

    return areas;
  }

  async searchAreas(text) {
    await this.props.setProjectDefault(this.project, 'areasSearchText', !text ? null : text);
    const areas = await Area.search(this.projectDefaults.areasSearchText, this.project).sorted(this.projectDefaults.areasSortByType, this.projectDefaults.areasSortDecending);
    await this.setState({ areas });
  }

  async copyArea(areaToCopy) {
    this.setState({ loadingSpinner: true });
    const newMobileId = await areaToCopy.createCopy();
    if (newMobileId) {
      const copy = await Area.find(newMobileId);
      if (copy) this.props.openArea(copy);
    } else {
      this.setState({ loadingSpinner: false });
    }
  }

  async clearSearch() {
    await this.props.setProjectDefault(this.project, 'areasSearchText', null);
    this.resetAreas()
  }

  noSearchAndSubAreaView() {
    return (!this.projectDefaults.areasSearchText && !!this.projectDefaults.subAreaView);
  }

  async deactivateArea(area) {
    await this.setState({ loadingSpinner: true })
    // setTimeout is so loadingSpinner displays
    setTimeout(() => {
      area.deactivate();
      this.resetAreas()
      this.setState({ loadingSpinner: false });
    }, 100);
  }

  async confirmDeactivation(area) {
    let subMessage = 'You cannot undo this action. ';
    if (area.children.filtered('active = true').length > 0) { subMessage += 'You are also deleting all sub-areas under this area'; }

    const buttons = [
      { text: 'Yes, delete it.', onPress: () => { this.deactivateArea(area); }, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Are You Sure?', subMessage, buttons, { cancelable: false });
  }

  async sortBy(field) {
    const sortingBy = !this.projectDefaults.areasSortDecending;
    await this.props.setProjectDefault(this.project, 'areasSortByType', field);
    await this.props.setProjectDefault(this.project, 'areasSortDecending', sortingBy);

    this.setState({
      areas: this.state.areas ? this.state.areas.sorted(this.projectDefaults.areasSortByType, this.projectDefaults.areasSortDecending) : Area.inProject(this.project).sorted(this.projectDefaults.areasSortByType, this.projectDefaults.areasSortDecending),
    });
  }

  async setVisibleAreas(area) {
    await realm.write(() => {
      area.opened = !area.opened;
    });

    this.resetAreas()
  }

  setHeaderCells() {
    const headerCells = [
      { flex: 1, title: '#', textAlign: 'center', onSort: () => this.sortBy('code'), sortedBy: this.projectDefaults.areasSortByType == 'code' },
      { flex: 1, title: 'Complete', textAlign: 'center'},
      { flex: 4, title: 'Area Name', onSort: () => !this.projectDefaults.subAreaView ? this.sortBy('name_with_parents') : this.sortBy('name'), sortedBy: !this.projectDefaults.subAreaView ? this.projectDefaults.areasSortByType == 'name_with_parents' : this.projectDefaults.areasSortByType == 'name' },
      { flex: 2.5, title: 'Location' },
      { flex: 2, title: 'Created At', onSort: () => this.sortBy('created_at'), sortedBy: this.projectDefaults.areasSortByType == 'created_at' },
      { flex: 1, title: 'Mapping', textAlign: 'center' },
      { flex: 1, title: 'Copy', textAlign: 'center' },
      { flex: 1, title: 'Delete', textAlign: 'center' },
    ];

    if (this.noSearchAndSubAreaView()) {
      headerCells.unshift({ flex: 0.5, title: '' });
    }
    return headerCells;
  }

  renderChildAreas(area, areas, level) {
    let childArray = [];

    for (let i = 0; i < areas.length; i++) {
      const childArea = areas[i];

      if (childArea.mobile_parent_id !== area.mobile_id) { continue; }

      childArray.push(
        <TableRow
          altColor
          bottomBorder
          onPressRow={() => this.props.openArea(childArea)}
          key={childArea.mobile_id}
        >
          {this.noSearchAndSubAreaView() &&
            <TableCell indentLevel={level} flex={0.5} alignItems="center">

              {Object.keys(childArea.children.filtered('active = true')).length > 0 &&
              <CollapseButton toggle={childArea.opened} onPress={() => this.setVisibleAreas(childArea)} />
              }

            </TableCell>
          }
          <TableCell type="text" flex={1} text={childArea.code} alignItems="center" />
          <TableCell type="icon" flex={1} alignItems="center">
            <Icon
              name={childArea.audit_complete ? 'check-circle' : 'times-circle'}
              iconStyle={{ color: childArea.audit_complete ? GREEN : 'tomato' }}
              size={20}
              type={'font-awesome'}
            />
          </TableCell>
          {!this.projectDefaults.subAreaView &&
            <TableCell type="text" flex={4} text={childArea.name_with_parents} />
          }
          {this.projectDefaults.subAreaView &&
            <TableCell type="text" flex={4} text={childArea.name} />
          }
          <TableCell type="text" flex={2.5} text={truncateString(childArea.locationName, 30)} />
          <TableCell type="text" flex={2} text={dateString(childArea.created_at)} />
          <TableCell flex={1} alignItems="center">

            {childArea.findFloorPlan &&
              <FloorPlanButton onPress={() => this.props.changeStack('floorplan', childArea, childArea, 'location')} mapStyle={childArea.mapping_style} />
            }

          </TableCell>
          <TableCell flex={1} alignItems="center">
            <CopyButton onPress={() => this.copyArea(childArea)} />
          </TableCell>
          <TableCell flex={1} alignItems="center">
            <DeleteButton onPress={() => this.confirmDeactivation(childArea)} />
          </TableCell>
        </TableRow>,
      );

      level += 1;
      const children = this.renderChildAreas(childArea, areas, level);
      if (children.length > 0) { childArray = childArray.concat(children); }
      level -= 1;
    }

    return childArray;
  }

  renderRows(areas) {
    if (areas.length < 1) {
      return (
        <View style={{ borderTopColor: 'lightgrey', flex: 1 }}>
          <EmptyMessage
            header={this.projectDefaults.areasSearchText ? 'No Areas Found' : 'No Areas Yet'}
            message={this.projectDefaults.areasSearchText ? '' : 'Press the "+ area" button above to create one'}
          />
        </View>
      );
    }
    let rows = [];
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];

      if (area.mobile_parent_id != null && this.noSearchAndSubAreaView()) { continue; }

      rows.push(
        <TableRow
          bottomBorder
          onPressRow={() => this.props.openArea(area)}
          altColor={false}
          key={area.mobile_id}
        >
          {this.noSearchAndSubAreaView() &&
            <TableCell flex={0.5} alignItems="center">

              {Object.keys(area.children.filtered('active = true')).length > 0 &&
                <CollapseButton toggle={area.opened} onPress={() => this.setVisibleAreas(area)} />
              }

            </TableCell>
          }
          <TableCell type="text" flex={1} text={area.code} alignItems="flex-start" />
          <TableCell type="icon" flex={1} alignItems="center">
            <Icon
              name={area.audit_complete ? 'check-circle' : 'times-circle'}
              iconStyle={{ color: area.audit_complete ? GREEN : 'tomato' }}
              size={20}
              type={'font-awesome'}
            />
          </TableCell>
          {!this.projectDefaults.subAreaView &&
            <TableCell type="text" flex={4} text={area.name_with_parents} />
          }
          {this.projectDefaults.subAreaView &&
            <TableCell type="text" flex={4} text={area.name} />
          }
          <TableCell type="text" flex={2.5} text={truncateString(area.locationName, 30)} />
          <TableCell type="text" flex={2} text={dateString(area.created_at)} />
          <TableCell flex={1} alignItems="center">

            {!!area.findFloorPlan &&
              <FloorPlanButton onPress={() => this.props.changeStack('floorplan', area, area, 'location')} mapStyle={area.mapping_style} />
            }

          </TableCell>
          <TableCell flex={1} alignItems="center">
            <CopyButton onPress={() => this.copyArea(area)} />
          </TableCell>
          <TableCell flex={1} alignItems="center">
            <DeleteButton onPress={() => this.confirmDeactivation(area)} />
          </TableCell>
        </TableRow>,
      );

      if (this.noSearchAndSubAreaView()) {
        const childAreas = this.renderChildAreas(area, areas, 0);
        rows = rows.concat(childAreas);
      }
    }

    return (
      <ScrollView>
        { rows }
      </ScrollView>
    );
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <LocationScopeButton
          project={this.project}
          afterAction={this.resetAreas}
        />
        <TableActionBar>
          <View style={{ flex: 6 }}>
            <SearchBar
              value={this.projectDefaults.areasSearchText}
              onChangeText={text => this.searchAreas(text)}
              onClear={() => this.clearSearch()}
              placeholder="search for an area"
            />
          </View>
          <View style={{ flex: 1 }}>
            <RLButton
              backgroundColor={this.projectDefaults.subAreaView ? GREEN : 'transparent'}
              color={this.projectDefaults.subAreaView ? 'white' : DARKER_GRAY}
              buttonStyle={{
                borderWidth: 2,
                borderColor: this.projectDefaults.subAreaView ? GREEN : DARKER_GRAY,
                flex: 1,
              }}
              title="sub-area view"
              onPress={() => this.subAreaViewToggle()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <RLButton
              title="+ area"
              onPress={() => this.props.changeStack('new area')}
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
          <View style={{ flex: 15 }} >
            <TableHeader headerCells={this.setHeaderCells()} />
            <View style={{ flex: 1 }}>
              {this.renderRows(this.state.areas)}
            </View>
          </View>
        }

      </View>
    );
  }
}

Areas.propTypes = {
  changeStack: PropTypes.func.isRequired,
  openArea: PropTypes.func.isRequired,
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

export default connect(mapStateToProps, mapDispatchToProps)(Areas);

