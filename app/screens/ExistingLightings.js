import React, { Component } from 'react';
import { Alert, StyleSheet, View, ScrollView, Dimensions, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { Icon } from 'react-native-elements';
import { GREEN, GS, FONT_GRAY, LIGHT_GREEN } from '../resources/styles/globals';
import {
  CopyButton,
  DeleteButton,
  TableHeader,
  TableRow,
  TableCell,
  BottomBar,
  ActionButton,
  ExistingLightingModal,
  FixedText,
} from '../components';

import { titleize } from '../lib/numberHelpers'
import SortableList from 'react-native-sortable-list';
import realm from '../database/realm';
import { Attachment } from '../database/models';
import memoize from 'fast-memoize';

const getExistingLightings = memoize((lightings) => {
  const existingLightings = [];

  for (const light of lightings) {
    const existingLighting = { light: light };
    existingLightings.push(existingLighting);
  }
  return existingLightings;
});

class ExistingLightings extends Component {
  constructor(props) {
    super(props);

    const existingLightings = getExistingLightings(props.project.activeExistingLightings);

    this.state = {
      allAttributes: props.allAttributes,
      existingLightings: existingLightings,
      existingLightingModalVisible: false,
      editingExistingFixtures: [],
      lighting: {},
      editDisplayOrder: false,
      existingLightingsForReorder: [],
    };

    const { width } = Dimensions.get('window');
    this.contentWidth = (width - 100) + ((props.allAttributes.length) * 150);

    this.setExistingLightingModalVisible = this.setExistingLightingModalVisible.bind(this);
    this.updateExistingFixtures = this.updateExistingFixtures.bind(this);
    this.existingLightingsListener = this.existingLightingsListener.bind(this);
  }

  async componentDidMount() {
    realm.addListener('change', this.existingLightingsListener);
    this.setExistingLightingsDataForReorder();
  }

  componentWillUnmount() {
    realm.removeAllListeners();
  }

  existingLightingsListener() {
    const existingLightings = getExistingLightings(this.props.project.activeExistingLightings);
    this.setState({ existingLightings })
  }

  setHeaderCells() {
    const headerCells = [
      { title: 'Actions', flex: 1.5, textAlign: 'center' },
      { title: 'Code', flex: 1, textAlign: 'center' },
      { title: 'Complete', flex: 1, textAlign: 'center' },
      { title: 'Name', flex: 4 },
      { title: 'Product Type', flex: 2, textAlign: 'center' },
      { title: 'Watts per Product', flex: 2, textAlign: 'center' },
      { title: 'Lamp Hours', flex: 2, textAlign: 'center' },
      { title: 'Quantity', flex: 2, textAlign: 'center' },
    ];

    for (const attribute of this.state.allAttributes) {
      if (attribute.input_type === 'textbox') { continue; }
      headerCells.push({
        title: attribute.name,
        flex: 2,
        textAlign: (attribute.input_type === 'integer' || 'number') ? 'center' : '',
      });
    }
    return headerCells;
  }

  setExistingLightingModalVisible(visible) {
    this.setState({ existingLightingModalVisible: visible });
  }

  confirmDeactivation(existingLightingDeactivate) {
    Alert.alert(
      'Are You Sure?',
      'You cannot undo this action',
      [
        { text: 'Yes, delete it.', onPress: () => this.deactivateExistingLighting(existingLightingDeactivate), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: false },
    );
  }

  async deactivateExistingLighting(lighting) {
    const matchingFixtures = await lighting.activeExistingProducts;

    if (matchingFixtures.length > 0) {
      await this.setState({ editingExistingFixtures: matchingFixtures.map(x => x), lighting });
      this.setExistingLightingModalVisible(true);
    } else {
      await lighting.deactivate();
      Attachment.deleteByAttachable('ExistingLighting', lighting.mobile_id);
    }
  }

  async updateExistingFixtures(lighting) {
    await this.state.editingExistingFixtures.forEach((fixture) => {
      fixture.changeProductSchedule(lighting.mobile_id, lighting.server_id);
    });
    await this.state.lighting.deactivate();
    Attachment.deleteByAttachable('ExistingLighting', this.state.lighting.mobile_id);
    this.setExistingLightingModalVisible(false);
  }

  renderExistingLightingsRows = ({ item: lightItem }, i) => {
    const { light } = lightItem;
    const customAttributes = JSON.parse(light.custom_attributes);
    const complete = light.audit_complete

    return(
      <TableRow
        bottomBorder
        noVertPadding
        altColor={false}
        onPressRow={() => this.props.editExistingLighting(light)}
      >
        <TableCell alignItems={'center'} flex={1.5}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={{ flex: 1 }}>
              <CopyButton onPress={() => this.props.copyExistingLighting(light)} />
            </View>
            <View style={{ flex: 1 }}>
              <DeleteButton onPress={() => this.confirmDeactivation(light)} />
            </View>
          </View>
        </TableCell>
        <TableCell type="text" flex={1} text={light.code} alignItems="center" />
        <TableCell type="icon" flex={1} alignItems="center">
          <Icon
            name={complete ? 'check-circle' : 'times-circle'}
            iconStyle={{ color: complete ? GREEN : 'tomato' }}
            size={20}
            type={'font-awesome'}
          />
        </TableCell>
        <TableCell type="text" flex={4} text={light.name} />
        <TableCell type="text" flex={2} text={titleize(light.existing_product_type)} alignItems="center" />
        <TableCell type="text" flex={2} text={light.watts_per_product} alignItems="center" />
        <TableCell type="text" flex={2} text={light.lm70} alignItems="center" />
        <TableCell type="text" flex={2} text={light.existingProductCount(light.mobile_id)} alignItems="center" />
        {this.renderCustomAttributesTableCells(customAttributes)}
      </TableRow>
    )
  }

  renderCustomAttributesTableCells(customAttributes) {
    const customAttributeTableCells = []
    for (let i = 0; i < this.state.allAttributes.length; i++) {
      const attribute = this.state.allAttributes[i];
      
      if (attribute.input_type === 'textbox'){ continue; }
      if (attribute.input_type === 'list') {
        customAttributeTableCells.push(
          <TableCell
            key={i}
            type="text"
            alignItems="center"
            flex={2}
            required={attribute.required_to_complete}
            text={customAttributes ? attribute.labelFromUuid(customAttributes[attribute.code_name]) : null}
          />
        )
      } else {
        customAttributeTableCells.push(
          <TableCell
            key={i}
            type="text"
            alignItems="center"
            flex={2}
            required={attribute.required_to_complete}
            text={customAttributes ? customAttributes[attribute.code_name] : null}
          />
        )
      }
    }
    return customAttributeTableCells;
  }


  setExistingLightingsDataForReorder() {
    const existingLightingsForReorder = {}
    for (let i = 0; i < this.props.project.activeExistingLightings.length; i++) {
      const existingLighting = this.props.project.activeExistingLightings[i];
      existingLightingsForReorder[existingLighting.display_order] = existingLighting
    }
    this.setState({ existingLightingsForReorder }) 
  }

  renderItem(row) {
    const existingLighting = row.data
    return (
      <View style={[styles.displayOrder, { backgroundColor: row.active ? LIGHT_GREEN : 'white',
        shadowColor: row.active ? '#3E4D53' : null,
        shadowOffset: row.active ? { width: 0, height: 5 } : null,
        shadowOpacity: row.active ? 0.3 : null,
        shadowRadius: row.active ? 1 : null,  
      }]}>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Icon
            name={'reorder'}
            iconStyle={{ color: row.active ? "white" : FONT_GRAY }}
            size={20}
            type={'font-awesome'}
          />
        </View>
        <View style={{flex: 4}}>
          <FixedText style={{ paddingLeft: 10, color: row.active ? "white" : FONT_GRAY, fontSize: 15 }}>{existingLighting.name}</FixedText>
        </View>
        <View style={{flex: 2, alignItems: 'center'}}>
          <FixedText style={{ color: row.active ? "white" : FONT_GRAY, fontSize: 15 }}>{titleize(existingLighting.existing_product_type)}</FixedText>
        </View>
        <View style={{flex: 2, alignItems: 'center'}}>
          <FixedText style={{ color: row.active ? "white" : FONT_GRAY, fontSize: 15 }}>{existingLighting.watts_per_product}</FixedText>
        </View>
        <View style={{flex: 2, alignItems: 'center'}}>
          <FixedText style={{ color: row.active ? "white" : FONT_GRAY, fontSize: 15 }}>{existingLighting.lm70}</FixedText>
        </View>
        <View style={{flex: 2, alignItems: 'center'}}>
          <FixedText style={{ color: row.active ? "white" : FONT_GRAY, fontSize: 15 }}>{existingLighting.existingProductCount(existingLighting.mobile_id)}</FixedText>
        </View>
      </View>
    )
  }

  updateDisplayOrder(data, oldLights) {
    const newDisplayOrder = {}
    for (let i = 0; i < data.length; i++) {
      const newPosition = data[i];
      newDisplayOrder[i] = oldLights[newPosition]
    }
    return newDisplayOrder
  }

  editOrder(key, newData){
    const newDisplayOrderArray = []
    for (const key in newData) {
      const existingLighting = newData[key];
      newDisplayOrderArray.push(existingLighting)
    }

    realm.write(() => {
      for (let i = 0; i < newDisplayOrderArray.length; i++) {
        const existingLighting = newDisplayOrderArray[i];
        existingLighting.display_order = i;
        existingLighting.edited = true;
      }
    })
    this.setState({ existingLightingsForReorder: newData })
  }

  render() {
    const { editDisplayOrder, existingLightings } = this.state
    return (
      <View style={styles.mainContainer}>

        {!this.state.editDisplayOrder && 
          <View style={{ flex: 1}}>
            <ScrollView
              horizontal
              contentContainerStyle={{ width: this.contentWidth }}
              showsHorizontalScrollIndicator={false}
            >
              <View style={{ flex: 1 }}>
                <TableHeader headerCells={this.setHeaderCells()} />
                <FlatList
                  data={existingLightings}
                  style={{ flex: 1 }}
                  keyExtractor={(item) => item.light.mobile_id.toString()}
                  renderItem={this.renderExistingLightingsRows}
                  initialNumToRender={15}
                  removeClippedSubviews
                />
              </View>
            </ScrollView>
          </View>
        }

        {this.state.editDisplayOrder &&
          <View style={{flex: 1}}>
            <TableHeader headerCells={[
              { title: 'Move', flex: 1, textAlign: 'center' },
              { title: 'Name', flex: 4 },
              { title: 'Product Type', flex: 2, textAlign: 'center' },
              { title: 'Watts per Product', flex: 2, textAlign: 'center' },
              { title: 'Lamp Hours', flex: 2, textAlign: 'center' },
              { title: 'Quantity', flex: 2, textAlign: 'center' },
            ]}/>
            <SortableList
              innerContainerStyle={{backgroundColor: '#E2E7EA'}}
              style={{flex: 1}}
              data={this.state.existingLightingsForReorder}
              renderRow={this.renderItem}
              onChangeOrder={(newOrder) => {
                newDisplayOrder = this.updateDisplayOrder(newOrder, this.state.existingLightingsForReorder)
              }}
              onReleaseRow={(key) => this.editOrder(key, newDisplayOrder)}
              order={Object.keys(this.state.existingLightingsForReorder)}
            />
          </View>
        }
        <BottomBar>
          <View style={{ flex: 1 }} />
          <View style={{ flex: -1 }}>
            <ActionButton
              alt={!!editDisplayOrder ? true : false}
              icon={'reorder'}
              title={!!editDisplayOrder ? "Back" : "Edit Order"}
              onPress={() => this.setState({ editDisplayOrder: !!editDisplayOrder ? false : true })}
            />
          </View>
          <View style={{ flex: -1 }}>
            <ActionButton
              icon={'star'}
              title={"Favorite"}
              onPress={() => this.props.changeStack('retrolux favorites')}
            />
          </View>
          <View style={{ flex: -1 }}>
            <ActionButton
              icon={'plus'}
              title="New Product"
              onPress={() => this.props.changeStack('new')}
            />
            </View>
        </BottomBar>
        <ExistingLightingModal
          editingExistingFixtures={this.state.editingExistingFixtures}
          existingLightingDeactivate={this.state.lighting}
          updateExistingFixtures={this.updateExistingFixtures}
          project={this.props.project}
          isVisible={this.state.existingLightingModalVisible}
          closeExistingLightingModal={() => this.setExistingLightingModalVisible(false)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    ...GS.flex1,
  },

  displayOrder: {
    height: 60, 
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ECEFF1',
    flexDirection: 'row',
    alignItems: 'center'
  }
});

ExistingLightings.propTypes = {
  project: PropTypes.object.isRequired,
  allAttributes: PropTypes.object.isRequired,
  editExistingLighting: PropTypes.func,
  copyExistingLighting: PropTypes.func,
  changeStack: PropTypes.func.isRequired,
};

export default ExistingLightings;
