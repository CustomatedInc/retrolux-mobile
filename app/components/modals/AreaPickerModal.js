import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Dimensions, FlatList } from 'react-native';
import { Icon } from 'react-native-elements';
import { GS, PRIMARY_BLUE } from './../../resources/styles/globals';
import { SearchBar, FixedText, TableRow, TableCell, EmptyMessage } from '../../components';
import Modal from 'react-native-modal';
import { Area } from '../../database/models';

const MODAL_HEIGHT = Dimensions.get('window').height - 400;
const MODAL_WIDTH = Dimensions.get('window').width - 400;

class AreaPickerModal extends Component {

  constructor(props) {
    super(props);

    const areas = props.areas;

    this.state = {
      isVisible: props.isVisible,
      areas: areas,
      search: null,
      searching: false,
      selectedAreaHolder: props.selectedAreaId,
      userSearched: null,
      prevProps: {}
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevProps = prevState.prevProps || {};
    const areas = prevProps.areas != nextProps.areas ? nextProps.areas : prevState.areas;
    return { prevProps: nextProps, areas }
  }

  async searchAreas(text) {
    this.setState({ searching: true });
    if (text == '') {
      this.clearSearch();
    } else {
      const areas = await this.props.areaPickerSearch(text);
      if (areas[0]) { // at least one result
        const foundAreas = []
        const sortedAreas = areas.sorted('name_with_parents', false);

        for (const area of sortedAreas) {
          const areaObject = { area: area };
          foundAreas.push(areaObject);
        }

        this.setState({ search: text, areas: foundAreas });
      } else { // no search results
        this.setState({ search: text, areas: [], userSearched: true });
      }
    }
    await setTimeout(() => this.setState({ searching: false }), 100);
  }

  async clearSearch() {
    await this.setState({ search: null, areas: this.props.areas });
  }

  renderSearchPickerResults = ({ item: areaItem }, i) => {
    const { area } = areaItem;
    const { selectedAreaHolder } = this.state;

    return (
      <TableRow
        onPressRow={() => {
          this.setState({ selectedAreaHolder: area.mobile_id })
        }}
        altColor={false}
        bottomBorder
        rowStyle={{ paddingHorizontal: 20, backgroundColor: selectedAreaHolder == area.mobile_id ? PRIMARY_BLUE : null }}
      >
        <TableCell
          backgroundColor={selectedAreaHolder == area.mobile_id ? PRIMARY_BLUE : null}
          fontColor={selectedAreaHolder == area.mobile_id ? 'white' : null}
          fontSize={14}
          flex={1}
          type="text"
          alignItems="flex-start"
          text={`${area.code}`}
        />
        <TableCell
          backgroundColor={selectedAreaHolder == area.mobile_id ? PRIMARY_BLUE : null}
          fontColor={selectedAreaHolder == area.mobile_id ? 'white' : null}
          fontSize={14}
          flex={9}
          type="text"
          alignItems="flex-start"
          text={`${area.name_with_parents}`}
        />
      </TableRow>
    )
  }

  render() {
    const { areas, searching, search } = this.state
    return (
      <Modal
        avoidKeyboard
        isVisible={this.props.isVisible}
        style={styles.modalContainer}
      >
        <View style={[styles.modal, { backgroundColor: areas.length > 0 ? 'white' : '#FAFAFD' }]}>
          <View style={styles.titleContainer}>
            <FixedText style={styles.title}>{this.props.title}</FixedText>
            <TouchableOpacity
              onPress={this.props.onCancel}
            >
              <Icon
                name={'close'}
                iconStyle={{ color: '#E2E7EA', paddingVertical: 5, paddingRight: 15 }}
                size={20}
                type={'font-awesome'}
              />
            </TouchableOpacity>
          </View>
          <View style={{ height: 80, padding: 15, ...GS.bgLightGray }}>
            <SearchBar
              value={search}
              onChangeText={text => this.setState({ search: text })}
              onSearch={() => this.searchAreas(search)}
              placeholder="search areas"
              autofocus={this.state.autofocus}
            />
          </View>
          <View style={styles.resultsScroll}>

            {searching ?
              <View style={{ flex: 1, marginTop: 30 }}>
                <EmptyMessage header="Searching..." />
              </View>
            : null}

            {!searching ?
              <View style={{ flex: 1 }}>

                {areas.length > 0 ?
                  <FlatList
                    data={areas}
                    style={{ flex: 1 }}
                    keyExtractor={(item) => item.area.mobile_id.toString()}
                    renderItem={this.renderSearchPickerResults}
                    initialNumToRender={20}
                    removeClippedSubviews
                  />
                : null}

                {areas.length == 0 ?
                  <View style={{ flex: 1, marginTop: 30 }}>
                    <EmptyMessage header={this.state.userSearched ? 'No Results. Try Again.' : 'Search Areas'} />
                  </View>
                : null}

              </View>
            : null}

          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                this.props.onCancel();
                this.setState({ selectedAreaHolder: this.props.selectedAreaId, search: null });
              }}
            >
              <FixedText style={styles.cancelButtonText}>close</FixedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                this.props.onSubmit(this.state.selectedAreaHolder);
                this.setState({ search: null });
              }}
            >
              <FixedText style={styles.buttonText}>{this.props.confirmButton}</FixedText>
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
    justifyContent: 'flex-start',
    width: MODAL_WIDTH,
    flex: 1,
  },

  modal: {
    borderRadius: 8,
    flex: -1,
    minHeight: MODAL_HEIGHT
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
    ...GS.bgLightGreen,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },

  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  resultsScroll: {
    minHeight: 250,
    flex: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  buttonsContainer: {
    flexDirection: 'row',
    height: 70,
  },

  button: {
    flex: 2,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomRightRadius: 8,
    ...GS.bgLightGreen,
  },

  cancelButton: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    ...GS.bgLightGray,
  },

  buttonText: {
    fontSize: 20,
    color: 'white',
  },

  cancelButtonText: {
    fontSize: 20,
    ...GS.darkerGray,
  },


});

export default AreaPickerModal;