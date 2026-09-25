import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, ScrollView, Dimensions, FlatList } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { GS, GRAY, GREEN, LIGHTEST_BLUE, LIGHTER_BLUE, LIGHT_BLUE, PRIMARY_BLUE } from './../../resources/styles/globals';
import { FixedText, ActionButton, ProductCounter } from '../../components';
import Modal from 'react-native-modal';
import { ExistingFixture, ExistingLighting } from '../../database/models';
import { increment, decrement, isNumber, formatLargeNumber, titleize } from '../../lib/numberHelpers';
import memoize from 'fast-memoize';

const getExistingLightings = memoize((lightings) => {
  const existingLightings = [];

  for (const light of lightings) {
    const existingLighting = { light: light };
    existingLightings.push(existingLighting);
  }
  return existingLightings;
});

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width - 200;
// const productButtonWidth = (modalWidth - 30 - 20) / 2;

class ExistingFixtureModal extends Component {

  constructor(props) {
    super(props);

    const existingLighting = props.existingLightingId ? ExistingLighting.find(props.existingLightingId) : null
    const existingLightings = getExistingLightings(props.project.activeExistingLightings);

    this.state = {
      action: props.action,
      existingLighting: existingLighting, // props or null
      existingLightings: existingLightings,
      quantity: '0',
    };
  }

  async createExistingFixture(existingLighting, toFixtureForm) {
    let existingFixture = await ExistingFixture.prepareFormDataForCreate(existingLighting, this.props.area, this.props.project);
    existingFixture.existing_count = Number(this.state.quantity);
    await ExistingFixture.create(existingFixture, false); // if true updates else create new

    await ExistingFixture.findAndRunUpdate(existingFixture.mobile_id)

    if (!!toFixtureForm) {
      detailsFixture = await ExistingFixture.find(existingFixture.mobile_id);
      this.props.editAreaProduct(detailsFixture)
    } else {
      this.saveEditFormSuccess()
    }
  }

  async editExistingFixture(existingLighting) {
    await this.props.afterRenderAction(existingLighting);
    this.saveEditFormSuccess();
  }

  async saveEditFormSuccess() {
    this.props.closeExistingFixtureModal();
    this.modalBackReset();
  }

  modalBackReset() {
    this.setState({existingLighting: null, quantity: '0'})
  }

  async incrementQuantity() {
    const newQuantity = await increment(this.state.quantity);
    await this.setState({ quantity: String(newQuantity) });
  }

  async decrementQuantity() {
    const newQuantity = await decrement(this.state.quantity);
    await this.setState({ quantity: String(newQuantity) });
  }

  async updateQuantity(qty) {
    let valid = await isNumber(qty);
    if (valid) {
      await this.setState({ quantity: qty });
    }
  }

  renderExistingLightingsRows = ({ item: lightItem }, i) => {
    const { light } = lightItem;
    return (
      <TouchableOpacity
        onPress={() => {
          if (this.state.action === 'edit') {
            this.editExistingFixture(light)
          } else {
            this.setState({ existingLighting: light })
          }
        }}
        style={[styles.productButton, { marginRight: 10 }]}
      >
        <View style={{flex: 9, flexDirection: 'row'}}>
          <Text style={{fontSize: 16, color: GREEN, marginRight: 4}}>{`(${light.code})`}</Text>
          <Text style={{fontSize: 16}}>{`${light.name}`}</Text>
        </View>
        <View style={{flex: 1}}>
          <Icon
            name={'plus'}
            iconStyle={{ color: GREEN, padding: 7.5 }}
            size={15}
            type={'font-awesome'}
          />
        </View>
      </TouchableOpacity>
    )
  }

  render() {
    const { action, existingLighting, existingLightings } = this.state;
    return (
      <Modal isVisible={this.props.isVisible} onModalHide={() => this.modalBackReset()} style={[styles.modalContainer, { width: MODAL_WIDTH }]}>
        <View style={styles.modal}>
          <View style={styles.titleContainer}>
            <FixedText style={styles.title}>{action === 'new' ? 'Add Product' : 'Change Product'}</FixedText>
            <TouchableOpacity
              onPress={this.props.closeExistingFixtureModal}
            >
              <Icon
                name={'close'}
                iconStyle={{ color: "#E2E7EA", paddingVertical: 5, paddingHorizontal: 15 }}
                size={20}
                type={'font-awesome'}
              />
            </TouchableOpacity>
          </View>
          <View style={{flex: 10, padding: 15 }}>

            {!existingLighting &&
              <FlatList
                data={existingLightings}
                style={{ flex: 1 }}
                numColumns={2}
                keyExtractor={(item) => item.light.mobile_id.toString()}
                renderItem={this.renderExistingLightingsRows}
                initialNumToRender={20}
                removeClippedSubviews
              />
            }

            {existingLighting &&
              <ScrollView style={{flex: 1}}>
                <View style={{flex: 1}}>
                  <View style={{ marginBottom: 10, borderWidth: 2, borderColor: LIGHT_BLUE, ...GS.borderRounded }}>
                    <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded, ...GS.borderTopRounded }}>
                      <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
                        <FixedText style={styles.infoText}>Add to Area:</FixedText>
                        <FixedText style={[styles.infoTextBold]}>{this.props.area.name}</FixedText>
                      </View>
                    </View>
                    <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded }}>
                      <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
                        <FixedText style={styles.infoText}>Product Name:</FixedText>
                        <FixedText style={[styles.infoTextBold]}>{existingLighting.name}</FixedText>
                      </View>
                    </View>
                    <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded }}>
                      <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
                        <FixedText style={styles.infoText}>Product Name:</FixedText>
                        <FixedText style={[styles.infoTextBold]}>{titleize(existingLighting.existing_product_type)}</FixedText>
                      </View>
                    </View>
                    <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded }}>
                      <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
                        <FixedText style={styles.infoText}>Watts/Product:</FixedText>
                        <FixedText style={[styles.infoTextBold]}>{existingLighting.watts_per_product}</FixedText>
                      </View>
                    </View>
                    <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded }}>
                      <View style={{ padding: 8, flexDirection: 'row' }}>
                        <FixedText style={styles.infoText}>Lamp Hours:</FixedText>
                        <FixedText style={[styles.infoTextBold]}>{formatLargeNumber(existingLighting.lm70)}</FixedText>
                      </View>
                    </View>
                  </View>

                  <ProductCounter
                    quantity={this.state.quantity}
                    onChangeText={text => this.updateQuantity(text)}
                    onIncrement={() => this.incrementQuantity()}
                    onDecrement={() => this.decrementQuantity()}
                    height={80}
                    containerStyle={{ flex: -1 }}
                    textStyle={{ fontSize: 22, fontWeight: 'bold' }}
                  />
                </View>
              </ScrollView>
            }
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={!existingLighting ? this.props.closeExistingFixtureModal : () => this.modalBackReset()}>
              <FixedText style={styles.cancelButtonText}>{'cancel'}</FixedText>
            </TouchableOpacity>

            {(action === 'new' && !existingLighting) &&

              <View style={{flex: 5, flexDirection: 'row', ...GS.center}}>
                <View style={{flex: 2}}>
                  <ActionButton
                    icon={'star'}
                    title={"Favorite"}
                    onPress={() => this.props.changeStack('retrolux favorites', this.props.area)}
                  />
                </View>
                <View style={{flex: 3}}>
                  <ActionButton
                    icon={'plus'}
                    title={"New Product"}
                    onPress={() => this.props.changeStack('new existing lighting form', this.props.area)}
                    insertStyle={{paddingRight: 0, marginRight: 0}}
                  />
                </View>
              </View>

            }

            {(action === 'new' && !!existingLighting) &&

              <View style={{flex: 5, flexDirection: 'row', ...GS.center}}>
                <View style={{flex: 2}}>
                  <ActionButton
                    icon={'plus'}
                    title={"Details"}
                    onPress={() => this.createExistingFixture(existingLighting, true)} // true = fixture ExistingFixtureForm
                  />
                </View>
                <View style={{flex: 3}}>
                  <ActionButton
                    backgroundColor={PRIMARY_BLUE}
                    icon={'save'}
                    title={"Save"}
                    onPress={() => this.createExistingFixture(existingLighting, false)}
                    insertStyle={{paddingRight: 0, marginRight: 0}}
                  />
                </View>
              </View>
              
            }

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
    marginHorizontal: 100,
    marginTop: 25,
    marginBottom: 25,
    flex: 1,
  },

  modal: {
    borderRadius: 8,
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
    backgroundColor: '#49d184',
    borderTopRightRadius: 5,
    borderTopLeftRadius: 5,
  },

  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  productButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderColor: GRAY,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },

  buttonsContainer: {
    flex: 1,
    padding: 15,
    flexDirection: 'row',
    backgroundColor: 'white',
    ...GS.borderTop,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    alignItems: 'center'
  },

  cancelButton: {
    flex: 1,
    borderRadius: 5,
    ...GS.bgLightGray,
    ...GS.center,
    margin: 10,
    marginLeft: 0,
    height: 60,
  },

  cancelButtonText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    ...GS.darkerGray,
  },

  infoText: {
    color: '#424242',
    flex: 1,
    fontSize: 16, 
  },

  infoTextBold: {
    color: '#424242',
    flex: -1,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default ExistingFixtureModal;