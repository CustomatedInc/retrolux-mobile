import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ScrollView, Dimensions, TextInput } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { GS, GRAY, LIGHT_GREEN, LIGHT_BLUE } from '../../resources/styles/globals';
import { FixedText } from '../../components';
import { titleize } from '../../lib/numberHelpers';
import Modal from 'react-native-modal';

class ClassicListModal extends Component {

  constructor(props) {
    super(props);

    width = (600 - 30 - 20) / 3 // (modal width(600) - padding(15x2) - white space(20)) / columns

    this.state = {
      width: width,
      height: 60, // minimum button height of 60
    };
  }

  async measureHeight(event) {
    height = event.nativeEvent.layout.height
    if (this.state.height < height) {
      await this.setState({ height: height })
    }
  }

  renderListItems() {
    const { width, height } = this.state;
    const { classicListItems, target, model } = this.props;
    if (!classicListItems) { return }

    listItemsRows = []
    for (let i = 0; i < classicListItems.length; i++) {
      const listItem = classicListItems[i];
      listItemsRows.push(  
        <TouchableOpacity key={i}
          style={[styles.listItemButton, {width: width, height: height, backgroundColor: model[target] == listItem ? LIGHT_GREEN : LIGHT_BLUE }]}
          onPress={() => {
            this.props.onPress(target, listItem);
            this.props.closeClassicListModalVisible();
          }}>
          <View onLayout={(event) => {this.measureHeight(event)}} style={{ padding: 10}}>
            <FixedText style={{textAlign: 'center', color: 'white'}}>{titleize(listItem)}</FixedText>
          </View>
        </TouchableOpacity>
      )
    }

    // renders filler inputs
    if (listItemsRows.length % 3 == 2) {
      listItemsRows.push(
        <TouchableOpacity key={'filler'}
          style={{width: width, height: height, ...GS.borderRounded, marginBottom: 10}}
          onPress={() => { null }}>
        </TouchableOpacity>
      )
    }

    return (
      <View style={{flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
        {listItemsRows}
      </View>
    )
  }

  render() {
    const { target } = this.props;
    return (
      <Modal
        isVisible={this.props.isVisible}
        animationInTiming={200}
        animationOutTiming={200}
        backdropTransitionInTiming={200}
        backdropTransitionOutTiming={200}
        style={styles.modalContainer}>
        <View style={styles.titleContainer}>
          <FixedText style={styles.title}>{titleize(target)}</FixedText>
          <TouchableOpacity
            onPress={this.props.closeClassicListModalVisible}
          >
            <Icon
              name={'close'}
              iconStyle={{ color: "#E2E7EA", paddingVertical: 5, paddingHorizontal: 15 }}
              size={20}
              type={'font-awesome'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.modal}>
          <View style={{flex: 1, padding: 15}}>
            <ScrollView>
              {this.renderListItems()}
              
            </ScrollView>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton}
              onPress={() => {
                this.props.closeClassicListModalVisible();
              }}>
              <FixedText style={styles.cancelButtonText}>cancel</FixedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                this.props.onPress(target, '');
                this.props.closeClassicListModalVisible();
            }}>
              <View style={{ padding: 10}}>
                <FixedText style={styles.clearButtonText}>clear input</FixedText>
              </View>
            </TouchableOpacity>
    
          </View>
        </View>
      </Modal>
    )
  }
}

const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: 'center',
    justifyContent: "center",
    width: 600,
    margin: 100,
    marginLeft: 200,
  },

  modal: {
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: 'white',
    flex: 1,
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
    backgroundColor: LIGHT_GREEN,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },

  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  buttonsContainer: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  cancelButton: {
    flex: 1,
    borderBottomLeftRadius: 8,
    ...GS.bgLightGray,
    ...GS.center,
  },

  cancelButtonText: {
    alignSelf: 'center',
    fontSize: 15,
    ...GS.darkerGray,
  },

  clearButton: {
    flex: 2,
    borderBottomRightRadius: 8,
    ...GS.bgMidGray,
    ...GS.center,
  },

  clearButtonText: {
    alignSelf: 'center',
    fontSize: 15,
    color: 'white',
  },

  listItemButton: {
    marginBottom: 10,
    ...GS.borderRounded,
    ...GS.center
  },

  otherInput: {
    marginBottom: 15,
    flexDirection: 'row',
    ...GS.center,
    ...GS.borderThin,
    ...GS.borderRounded,
  },

  stringInput: {
    backgroundColor: '#fff',
    margin: 0,
    padding: 5,
    fontSize: 14,
    flexGrow: 1,
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  }
});

export default ClassicListModal;