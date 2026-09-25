import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ScrollView, Dimensions, TextInput } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { GS, GRAY, LIGHT_GREEN, LIGHT_BLUE } from '../../resources/styles/globals';
import { FixedText } from '../../components';
import Modal from 'react-native-modal';

class CustomAttributeListModal extends Component {

  constructor(props) {
    super(props);

    width = (600 - 30 - 20) / 3 // (modal width(600) - padding(15x2) - white space(20)) / columns

    this.state = {
      width: width,
      height: 60, // minimum button height of 60
      otherInputClicked: false
    };
  }

  async measureHeight(event) {
    height = event.nativeEvent.layout.height
    if (this.state.height < height) {
      await this.setState({ height: height })
    }
  }

  renderOtherInput() {
    const { listAttribute, customAttributes } = this.props;
    if (this.state.otherInputClicked) {
      return(
        <View style={styles.otherInput}>
          <View style={{flexGrow: 1}}>
            <TextInput
              style={styles.stringInput}
              value={customAttributes ? listAttribute.labelFromUuid(customAttributes[listAttribute.code_name]) : ''}
              keyboardType={'default'}
              onChangeText={(text) => this.props.onPress(listAttribute.code_name, text)}  // future problem: will need to set label of other.uuid to text.
                                                                                          // and if input is a number then validate.
            />
          </View>
          <TouchableOpacity
            style={{backgroundColor: GRAY}}
            onPress={() => {
              this.props.onPress(listAttribute.code_name, ''); // future problem: will need to set label of other.uuid to blank.
          }}>
            <View style={{paddingVertical: 15, paddingHorizontal: 20}}>
              <FixedText style={{textAlign: 'center', ...GS.darkerGray}}>{'Clear'}</FixedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={{backgroundColor: LIGHT_GREEN, borderBottomRightRadius: 5, borderTopRightRadius: 5}}
            onPress={() => {
              this.props.closeCustomAttributeListModal();
              this.setState({ otherInputClicked: false });
          }}>
            <View style={{paddingVertical: 15, paddingHorizontal: 20}}>
              <FixedText style={{textAlign: 'center', color: 'white'}}>{'Save'}</FixedText>
            </View>
          </TouchableOpacity>
        </View>
      )
    } else { return( <View/> ) }
  }

  toggleOtherInput() {
    if (this.state.otherInputClicked) {
      this.setState({ otherInputClicked: false })
    } else {
      this.setState({ otherInputClicked: true })
    }
  }

  renderListItems() {
    const { width, height } = this.state;
    const { listItems, customAttributes, listAttribute } = this.props;
    if (!listItems) { return }

    listItemsRows = []
    for (let i = 0; i < listItems.length; i++) {
      const listItem = listItems[i];
      listItemsRows.push(  
        <TouchableOpacity key={i}
          style={[styles.listItemButton, {width: width, height: height, backgroundColor: customAttributes[listAttribute.code_name] == listItem.uuid ? LIGHT_GREEN : LIGHT_BLUE }]}
          onPress={() => {
            this.props.onPress(listAttribute.code_name, listItem.uuid);
            this.props.closeCustomAttributeListModal();
            this.setState({ otherInputClicked: false });
          }}>
          <View onLayout={(event) => {this.measureHeight(event)}} style={{ padding: 10}}>
            <FixedText style={{textAlign: 'center', color: 'white'}}>{listItem.label}</FixedText>
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
    const { listAttribute } = this.props;
    return (
      <Modal
        isVisible={this.props.isVisible}
        animationInTiming={200}
        animationOutTiming={200}
        backdropTransitionInTiming={200}
        backdropTransitionOutTiming={200}
        style={styles.modalContainer}>
        <View style={styles.titleContainer}>
          <FixedText style={styles.title}>{this.props.listAttribute.label}</FixedText>
          <TouchableOpacity
            onPress={this.props.closeCustomAttributeListModal}
          >
            <Icon
              name={'close'}
              iconStyle={{ color: "#E2E7EA", paddingVertical: 5, paddingRight: 15 }}
              size={20}
              type={'font-awesome'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.modal}>
          <View style={{flex: 1, padding: 15}}>
            {this.renderOtherInput()}
            <ScrollView>
              {this.renderListItems()}
            </ScrollView>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton}
              onPress={() => {
                this.props.closeCustomAttributeListModal(); 
                this.setState({ otherInputClicked: false });
              }}>
              <FixedText style={styles.cancelButtonText}>cancel</FixedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                this.props.onPress(listAttribute.code_name, '');
                this.props.closeCustomAttributeListModal();
                this.setState({ otherInputClicked: false });
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

export default CustomAttributeListModal;