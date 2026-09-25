import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Dimensions, FlatList } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { GS, GRAY, LIGHT_GREEN, LIGHTER_BLUE } from './../../resources/styles/globals';
import { FixedText, SearchBar } from '../../components';
import Modal from 'react-native-modal';
import Fuse from 'fuse.js'

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width - 200;

class SearchInputModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collection: props.collection,
      search: '',
      prevProps: {}
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevProps = prevState.prevProps || {};
    const collection = prevProps.collection != nextProps.collection ? nextProps.collection : prevState.collection;
    return { prevProps: nextProps, collection }
  }

  async searchCollection(searchText) {
    let searchedCollection;
    // If a realm object
    if (this.props.target != 'physicalState') {
      searchedCollection = await this.props.collection.filtered(`name CONTAINS[c] $0 LIMIT(20)`, searchText);
    } else {
      searchedCollection = []

      let options = {
        includeScore: true,
        keys: ['name'],
        threshold: 0.4
      }

      const fuse = new Fuse(this.props.collection, options)
      let foundItems = fuse.search(searchText)

      for (let i = 0; i < foundItems.length; i++) {
        const foundCollectionItem = foundItems[i];
        searchedCollection.push(foundCollectionItem['item'])
      }
    }
    this.setState({ collection: searchedCollection })
  }

  setCollectionItem(value) {
    this.props.onPress(this.props.target, value);
    this.setState({ search: '' })
    this.props.closeModal();
  }

  renderCollectionRows = ({ item: collectionItem }, i) => {
    return (
      <TouchableOpacity
        onPress={() => { this.setCollectionItem(collectionItem.id) }}
        style={[styles.productButton, { backgroundColor: this.props.currentValue == collectionItem.id ? LIGHTER_BLUE : 'white' }]}
      >
        <View style={{flex: 1, flexDirection: 'row'}}>
          <Text style={{ fontSize: 18 }}>{collectionItem.state ? `${collectionItem.name} - ${collectionItem.state}` : `${collectionItem.name}`}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  render() {
    const { collection, search } = this.state;

    return (
      <Modal
        isVisible={this.props.isVisible}
        animationInTiming={100}
        animationOutTiming={100}
        backdropTransitionInTiming={100}
        backdropTransitionOutTiming={100}
        style={[styles.modalContainer, { width: MODAL_WIDTH }]}>
        <View style={styles.titleContainer}>
          <FixedText style={styles.title}>{this.props.title}</FixedText>
          <TouchableOpacity
            onPress={this.props.closeModal}
          >
            <Icon
              name={'close'}
              iconStyle={{ color: "#E2E7EA", paddingVertical: 5, paddingRight: 15 }}
              size={20}
              type={'font-awesome'}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 80, padding: 15, ...GS.bgLightGray }}>
          <SearchBar
            value={search}
            onChangeText={text => this.setState({ search: text })}
            onSearch={() => this.searchCollection(search)}
            placeholder="search"
          />
        </View>

        <View style={styles.modal}>
          <FlatList
            data={collection}
            style={{ flex: 1 }}
            numColumns={1}
            keyExtractor={(collectionItem) => collectionItem.id.toString()}
            renderItem={this.renderCollectionRows}
            initialNumToRender={20}
            removeClippedSubviews
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.cancelButton}
            onPress={this.props.closeModal}>
            <FixedText style={styles.cancelButtonText}>cancel</FixedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => { this.setCollectionItem('') }}>
            <View style={{ padding: 10}}>
              <FixedText style={styles.clearButtonText}>clear input</FixedText>
            </View>
          </TouchableOpacity>
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
    flex: 1
  },

  modal: {
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: 'white',
    flex: 1,
    padding: 20
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

  productButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    paddingVertical: 17.5,
    borderColor: GRAY,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },

  buttonsContainer: {
    height: 80,
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


});

export default SearchInputModal;