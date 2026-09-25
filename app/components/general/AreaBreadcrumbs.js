import React, { Component } from 'react';
import { Picker, TouchableOpacity, StyleSheet, View, Text, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import realm from '../../database/realm';
import { GS, DARKER_GRAY, BLACK_GRAY } from './../../resources/styles/globals';
import { truncateString } from '../../lib/numberHelpers';
import { Area } from '../../database/models';
import { AreaPickerModal } from '../../components';
import Modal from 'react-native-modal';

class AreaBreadcrumbs extends Component {
  constructor(props) {
    super(props);
    const { area, area: { mobile_parent_id } } = props;

    const breadcrumbParents = mobile_parent_id ? [] : null;
    this.state = {
      area,
      breadcrumbParents,
      jumpToModalVisible: false,
      selectedArea: null,
      prevProps: {}
    };

    this.setJumpToModalVisible = this.setJumpToModalVisible.bind(this);
    this.jumpToArea = this.jumpToArea.bind(this);
    this.areaPickerSearch = this.areaPickerSearch.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevProps = prevState.prevProps || {};
    const area = prevProps.area != nextProps.area ? nextProps.area : prevState.area;
    return { prevProps: nextProps, area }
  }

  componentDidMount() {
    const { area } = this.props;
    if (area.mobile_parent_id) {
      this.getBreadcrumbParents(area);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.area != this.state.area) {
      this.getBreadcrumbParents(this.state.area);
    }
  }

  async getBreadcrumbParents(area) {
    if (!area.mobile_parent_id) { this.setState({ breadcrumbParents: null }); return; }
    const parentAreas = [];
    let noParent = false;
    var area = area;

    let parentBreadcrumbArea = await realm.objects('Area').filtered(`mobile_id = ${area.mobile_parent_id}`)[0];
    parentAreas.push(parentBreadcrumbArea);

    while (noParent == false) {
      parentBreadcrumbArea = await realm.objects('Area').filtered(`mobile_id = ${parentBreadcrumbArea.mobile_parent_id}`)[0];
      if (parentBreadcrumbArea) {
        parentAreas.push(parentBreadcrumbArea);
      } else {
        noParent = true;
      }
    }

    this.setState({ breadcrumbParents: parentAreas.reverse() });
  }

  async changeValue(itemValue) {
    await this.setState({ selectedArea: realm.objects('Area').filtered(`mobile_id= ${itemValue}`)[0] });
  }

  async jumpToArea(mobileId) {
    if (mobileId) {
      const area = await realm.objects('Area').filtered('mobile_id = $0', mobileId)[0]
      this.props.changeEditingArea(area);
    }
  }

  setJumpToModalVisible(bool) {
    this.setState({ jumpToModalVisible: bool });
  }

  adjustBreadcrumbScroll(width, height) {
    // slides to end of horizontal scroll if scroll view off of screen
    this.refs.breadcrumbScroll.scrollToEnd();
  }


  renderCurrentLocationCrumb() {
    if (this.state.area.mobile_location_id) {
      const location = realm.objects('Location').filtered(`mobile_id= ${this.state.area.mobile_location_id}`)[0]
      currentLocationCrumb = (
        <View style={styles.breadcrumbLink}>
          <View style={styles.breadcrumbButton}>
            <Text style={styles.breadcrumbText}>{truncateString(location.name, 20)}</Text>
          </View>
          <View>
            <Text style={styles.breadcrumbText}>/</Text>
          </View>
        </View>
      );
    } else {
      currentLocationCrumb = (
        <View/>
      )
    }

    return (currentLocationCrumb);
  }

  renderCurrentAreaCrumb() {
    if (this.state.area.mobile_id) {
      currentAreaCrumb = (
        <View style={styles.breadcrumbLink}>
          <TouchableOpacity
            style={styles.breadcrumbButton}
            onPress={() => this.props.changeEditingArea(realm.objects('Area').filtered(`mobile_id= ${this.state.area.mobile_id}`)[0])}
          >
            <Text style={styles.breadcrumbText}>{truncateString(this.state.area.name, 20)}</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      currentAreaCrumb = (
        <View style={styles.breadcrumbLink}>
          <TouchableOpacity
            style={styles.breadcrumbButton}
            onPress={() => null}
          >
            <Text style={styles.breadcrumbTextNewArea}>{this.state.area.name ? truncateString(this.state.area.name, 20) : 'New Area'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (currentAreaCrumb);
  }

  renderBreadCrumbs() {
    if (this.state.breadcrumbParents) {
      return (
        <View style={styles.breadcrumbHolder}>
          {this.state.breadcrumbParents.map(parent_area => (
            <View style={styles.breadcrumbLink} key={parent_area.mobile_id}>
              <TouchableOpacity
                style={styles.breadcrumbButton}
                onPress={() => this.props.changeEditingArea(parent_area)}
              >
                <Text style={styles.breadcrumbText}>{truncateString(parent_area.name, 20)}</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.breadcrumbText}>/</Text>
              </View>
            </View>
          ))}
          {this.renderCurrentAreaCrumb()}
        </View>
      );
    }
    return (
      <View style={styles.breadcrumbHolder}>
        {this.renderCurrentAreaCrumb()}
      </View>
    );
  }

  async areaPickerSearch(text) {
    areas = await Area.search(text, this.props.project);
    return areas;
  }

  render() {
    return (
      <View style={styles.breadcrumbBox}>
        <ScrollView
          ref="breadcrumbScroll"
          horizontal
          style={{ flex: 1 }}
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={(width, height) => this.adjustBreadcrumbScroll(width, height)}
        >
          {this.renderCurrentLocationCrumb()}
          {this.renderBreadCrumbs()}
        </ScrollView>
        <TouchableOpacity
          onPress={() => this.setJumpToModalVisible(true)}
          style={styles.jumpToButton}
        >
          <Icon
            name="search"
            color="white"
            iconStyle={{ margin: 5 }}
            size={25}
          />
        </TouchableOpacity>
        <AreaPickerModal
          areaPickerSearch={this.areaPickerSearch}
          project={this.props.project}
          isVisible={this.state.jumpToModalVisible}
          title='Jump To Area'
          confirmButton='go'
          onSubmit={this.jumpToArea}
          onCancel={() => this.setJumpToModalVisible(false)}
          areas={[]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({

  breadcrumbHolder: {
    flexDirection: 'row',
  },

  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  breadcrumbText: {
    ...GS.mdFont,
    color: BLACK_GRAY,
  },

  breadcrumbTextNewArea: {
    ...GS.mdFont,
    color: DARKER_GRAY,
  },

  breadcrumbButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  breadcrumbBox: {
    flex: 1,
    ...GS.bgLightestGray,
    borderRadius: 5,
    flexDirection: 'row',
  },

  jumpToButton: {
    ...GS.bgBlue,
    width: 70,
    borderRadius: 5,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  modalContainer: {
    alignSelf: 'center',
    justifyContent: 'flex-start',
    width: 600,
    margin: 100,
    marginLeft: 200,
    marginTop: 25,
    flex: 1,
  },

  cancelButton: {
    flex: 1,
    padding: 15,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...GS.bgLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 20,
    ...GS.darkerGray,
  },

  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingLeft: 15,
    paddingRight: 0,
    paddingVertical: 15,
    ...GS.borderBottom,
    backgroundColor: '#49d184',
    borderTopRightRadius: 5,
    borderTopLeftRadius: 5,
  },

  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  modal: {
    borderRadius: 8,
    backgroundColor: 'white',
    flex: -1,
  },

  buttonsContainer: {
    ...GS.borderTop,
    height: 60,
  },

  resultsScroll: {
    paddingBottom: 10,
    paddingHorizontal: 15,
    height: 250,
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },

});

AreaBreadcrumbs.propTypes = {
  project: PropTypes.object.isRequired,
  changeEditingArea: PropTypes.func.isRequired,
};

export default AreaBreadcrumbs;
