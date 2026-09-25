import React, { Component } from 'react';
import { ActivityIndicator, TouchableOpacity, Text, ScrollView, StyleSheet, View, Alert, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { GS, PALE_GREEN, GRAY, SPACING_XS } from '../resources/styles/globals';
import realm from '../database/realm';
import { WarningMessage, FixedText, ActionButton, Form, Sidebar, SidebarLabel, SidebarButton, SearchBar, BottomBar, AreaBreadcrumbs } from '../components/index';
import ExistingFixtureForm from './ExistingFixtureForm';
import { ExistingFixture, ExistingLighting, ExistingCategoryTreeEntry } from '../database/models';
import { Icon } from 'react-native-elements';
import { bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import * as Actions from '../actions';

class ProductForm extends Component {
  constructor(props) {
    super(props);

    this.project = props.project;
    this.productDefaults = props.productDefaults[this.project.mobile_id]

    const company = this.project.company;
    const companyFavorites = company.favoriteExistingLightings();

    let displayProducts = [];

    if (this.productDefaults.companyFavoriteClicked) {
      displayProducts = companyFavorites
    } else if (this.productDefaults.selectedEntry) {
      displayProducts = this.productDefaults.selectedEntry.products
    }

    if (displayProducts.length > 0) {
      displayProducts = displayProducts.sorted('name', this.productDefaults.productSortDecending)
    }

    if (displayProducts.length > 0 && !!this.productDefaults.productSearchText) {
      displayProducts = displayProducts.filtered(`name CONTAINS[c] "${this.productDefaults.productSearchText}"`);
    }

    this.state = {
      categoryTypes: [],
      company: company,
      companyFavorites: companyFavorites.sorted('name', this.productDefaults.productSortDecending) || [],
      topLevelTypes: [],
      entries: ExistingCategoryTreeEntry.all,
      topLevelEntries: ExistingCategoryTreeEntry.topLevelEntries,
      displayTypes: [],
      displayEntries: ExistingCategoryTreeEntry.topLevelEntries,
      displayProducts: displayProducts,
      existingFixture: this.props.existingFixture, // editing not yet.
      product: null,
      searchText: this.productDefaults.productSearchText || '',
    };

    this.backTo = this.backTo.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.addProduct = this.addProduct.bind(this);
    this.editProduct = this.editProduct.bind(this);
    this.browse = this.browse.bind(this);
  }

  componentDidMount() {
    ExistingCategoryTreeEntry.categoryTypes.then((types) => {
      // below is complicated, but doing what this.browse() does
      // setting the sidebar
      let categoryTypes = JSON.parse(types);
      if (categoryTypes !== null) {
        const topLevelTypes = categoryTypes.filter(type => type.parent_enum === null);
        let displayTypes = topLevelTypes
        let treeTerminus = null
        let displayEntries = this.state.displayEntries;

        let childEntries = this.productDefaults.selectedEntry ? this.productDefaults.selectedEntry.children : [];
        if (this.productDefaults.selectedEntry && childEntries.length === 0) {
          childEntries = realm.objects('ExistingCategoryTreeEntry').filtered('active = true').filtered('id = $0', this.productDefaults.selectedEntry.id)
          displayEntries = childEntries;
          treeTerminus = this.productDefaults.selectedEntry.id
        } else if (childEntries.length === 0) {
          treeTerminus = this.productDefaults.selectedEntry ? this.productDefaults.selectedEntry.id : null;
        } else {
          displayEntries = childEntries;
        }

        const childEntriesArray = childEntries.map(entry => Object.assign({}, entry));
        const typeIds = _.uniq(_.map(childEntriesArray, entry => entry.category_type_id));
        let levelTypes = categoryTypes.filter(type => typeIds.includes(type.enum));
        levelTypes = _.uniqBy(levelTypes, 'name');

        if (this.productDefaults.selectedEntry && levelTypes.length === 0) {
          displayTypes = levelTypes
          treeTerminus = this.productDefaults.selectedEntry.id;
        } else if (levelTypes.length === 0) {
          treeTerminus = this.productDefaults.selectedEntry ? this.productDefaults.selectedEntry.id : null;
        } else {
          displayTypes = levelTypes
        }

        this.setState({
          categoryTypes: categoryTypes,
          topLevelTypes,
          displayTypes: displayTypes,
          displayEntries: displayEntries,
          treeTerminus: treeTerminus,
        });
      }
    });
  }

  setBrowseDimensions = (event) => {
    // get the height, width of the space available to render product cards
    const { width, height } = event.nativeEvent.layout;
    this.setState({ browseWidth: width, browseHeight: height, cardWidth: (width - 50) / 4, subCardWidth: ((width - 50) / 4) - 12 });
  }

  async setProduct(product) {
    await this.setState({ product });
  }

  async editProduct(existingFixture) {
    // used by the ExistingFixtureForm screen to change an existing product
    await this.setState({ editingFixture: existingFixture });
    this.setState({ stack: 'edit product' });
  }

  async browse(entry) {
    await this.props.setProductDefault(this.project, 'companyFavoriteClicked', false);
    await this.props.setProductDefault(this.project, 'selectedEntry', entry);
    const productsToDisplay = await this.updateProducts(this.productDefaults.selectedEntry);
    const childEntries = await this.productDefaults.selectedEntry.children;
    if (childEntries.length === 0) {
      this.setState({ treeTerminus: entry.id });
      return;
    }
    const childEntriesArray = childEntries.map(entry => Object.assign({}, entry));
    const typeIds = _.uniq(_.map(childEntriesArray, entry => entry.category_type_id));
    const categoryTypes = this.state.categoryTypes;
    let levelTypes = categoryTypes.filter(type => typeIds.includes(type.enum));
    levelTypes = _.uniqBy(levelTypes, 'name');

    if (levelTypes.length === 0) {
      this.setState({ treeTerminus: entry.id });
      return;
    }

    this.setState({
      displayEntries: childEntries,
      displayTypes: levelTypes,
      displayProducts: productsToDisplay.sorted('name', this.productDefaults.productSortDecending),
      treeTerminus: null,
    });
  }

  async browseBack() {
    const lastSelectedEntry = this.productDefaults.selectedEntry;
    if (lastSelectedEntry.parent_id) {
      const entry = await lastSelectedEntry.parent;
      this.browse(entry);
    } else {
      await this.props.setProductDefault(this.project, 'selectedEntry', null);
      await this.setState({
        displayProducts: [],
        displayEntries: this.state.topLevelEntries,
        displayTypes: this.state.topLevelTypes,
      });
      if (this.productDefaults.productSearchText) { this.startSearch(this.productDefaults.productSearchText); }
    }
  }

  async updateProducts(categoryEntry) {
    let products = [];
    if (categoryEntry) { products = categoryEntry.products; }
    if (this.productDefaults.productSearchText) { products = await this.searchProducts(products, this.productDefaults.productSearchText); }
    return products
  }

  async searchProducts(products, search) {
    if (search == null || search == '') { return products }
    products = await products.filtered(`name CONTAINS[c] "${search}"`);
    return products;
  }

  handleSearchTextChange = (text) => {
    this.setState({ searchText: text });
    this.props.setProductDefault(this.project, 'productSearchText', text == '' ? null : text)
  };

  async onPressSearch() {    
    await this.setState({ searching: true, searchActive: this.productDefaults.productSearchText !== null });
    this.startSearch(this.productDefaults.productSearchText);
  }

  async startSearch(text) {
    const stateValid = this.state.displayProducts && this.state.displayProducts.length > 0 && !!this.productDefaults.selectedEntry
    let baseProducts = stateValid ? this.state.displayProducts : await ExistingLighting.showables
    baseProducts = this.productDefaults.companyFavoriteClicked && this.state.companyFavorites ? this.state.companyFavorites : baseProducts

    if (text !== '' && text !== null) {
      let products = await this.searchProducts(baseProducts, this.productDefaults.productSearchText);

      this.setState({
        displayProducts: products.sorted('name', this.productDefaults.productSortDecending),
        searching: false,
      });
    } else {
      await this.props.setProductDefault(this.project, 'productSearchText', null);
      await this.setState({ searching: false, searchText: '' });
      if (this.productDefaults.companyFavoriteClicked && this.state.companyFavorites) {
        this.setState({ displayProducts: this.state.companyFavorites.sorted('name', this.productDefaults.productSortDecending) });
      } else {
        const productsToDisplay = await this.updateProducts(this.productDefaults.selectedEntry);
        this.setState({ displayProducts: productsToDisplay.length > 0 ? productsToDisplay.sorted('name', this.productDefaults.productSortDecending) : [] });
      }
    }
  }

  addProduct() {
    this.onSubmit('save');
  }

  async onSubmit(redirectTo) {
    if (!this.state.product) { return this.alertMissingData(); }
    this.props.copyExistingLighting(this.state.product, true, this.props.area ? this.props.area : null) // product = existingLighting
  }

  handleRedirect(action) {
    if (action === 'save') {
      this.backTo(false);
    }
  }

  alertMissingData = () => {
    if (!this.state.product) {
      Alert.alert('Missing Product', 'Please select a product before continuing');
    }
  }

  async sortDisplayProducts() {
    await this.props.setProductDefault(this.project, 'productSortDecending', !this.productDefaults.productSortDecending);
    this.setState({
      displayProducts: this.state.displayProducts.sorted('name', this.productDefaults.productSortDecending)
    })
  }

  async showCompanyFavorites() {
    await this.props.setProductDefault(this.project, 'companyFavoriteClicked', !this.productDefaults.companyFavoriteClicked);
    await this.props.setProductDefault(this.project, 'selectedEntry', null);

    this.setState({
      product: null,
      displayProducts: this.productDefaults.companyFavoriteClicked ? this.state.companyFavorites.sorted('name', this.productDefaults.productSortDecending) : [],
      displayEntries: this.state.topLevelEntries,
      displayTypes: this.state.topLevelTypes,
    })
  }

  backTo(modal) {
    if (this.props.area) {
      this.props.changeEditingArea(realm.objects('Area').filtered(`mobile_id = ${this.props.area.mobile_id}`)[0], modal ? true : false);
    } else {
      this.props.changeStack('index')
    }
  }

  renderProductCard = ({ item, i }) => {
    return (
      <TouchableOpacity
        key={item.mobile_id}
        onPress={() => this.setProduct(item)}
        style={[{
          width: this.state.cardWidth,
          borderRadius: 5,
          borderWidth: 3,
          backgroundColor: GRAY,
          margin: SPACING_XS,
          alignItems: 'center',
          borderColor: this.state.product && this.state.product.name === item.name ? PALE_GREEN : GRAY,
          ...GS.flexMinus,
        }, styles.productCardContainer]}
      >
        <Text style={[{ width: this.state.subCardWidth }, styles.headerText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const {
      displayTypes,
      displayEntries,
      displayProducts,
      treeTerminus,
      entries,
      categoryTypes,
      searchText,
    } = this.state;

    return (
      <Form>
        <View style={{flex: 1}}>

          { this.props.area &&

            <View style={{ flex: 1, marginTop: 10, marginBottom: 5, marginHorizontal: 10 }}>
              <AreaBreadcrumbs
                style={{ flex: 1}}
                project={this.props.project}
                area={this.props.area}
                changeEditingArea={this.props.changeEditingArea}
              >
              </AreaBreadcrumbs>
            </View>

          }

          <View style={{flex: 15, flexDirection: 'row'}}>

            <View style={styles.sidebarContainer}>
              <Sidebar>
                {this.state.companyFavorites.length > 0 &&
                  <SidebarButton
                    name="Company Favorites"
                    icon={'star'}
                    selected={this.productDefaults.companyFavoriteClicked}
                    textStyle={{ fontWeight: 'bold' }}
                    onPress={() => this.showCompanyFavorites()}
                  />
                }
                {(displayTypes && displayTypes[0] && displayTypes[0].parent_enum) &&
                  <SidebarButton
                    name="Back"
                    icon={"arrow-left"}
                    textStyle={{ fontWeight: 'bold' }}
                    onPress={() => this.browseBack()}
                  />
                }
                {displayTypes.map(type => (
                  <SidebarLabel key={type.parent_enum + '-' + type.enum} label={type.name}>
                    {displayEntries.filtered('category_type_id = $0', type.enum).map(entry => (
                      <SidebarButton
                        selected={treeTerminus && entry.id === treeTerminus}
                        key={entry.parent_id + '-' + entry.id}
                        name={entry.category_name}
                        onPress={() => this.browse(entry)}
                      />
                    ))}
                  </SidebarLabel>
                ))}
              </Sidebar>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.topBarContainer}>
                <View style={{...GS.flex1}}>
                  <SearchBar
                    value={searchText}
                    onChangeText={this.handleSearchTextChange}
                    onSearch={() => this.onPressSearch()}
                    placeholder="search for a product"
                  />
                </View>
              </View>
              <View style={[GS.flex1, GS.p5]} onLayout={this.setBrowseDimensions}>
                <ScrollView>

                  {(entries.length === 0 || !categoryTypes) &&

                    <WarningMessage
                      message="Oops. Looks like we don't have some necessary data. Please sync and try again."
                      containerStyles={{ marginHorizontal: 10 }}
                    />

                  }

                  {displayProducts.length > 0 &&

                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FixedText style={[GS.graySubheading, GS.p10]}>{this.productDefaults.companyFavoriteClicked ? 'Select a company favorite product:' : 'Select a product:'}</FixedText>
                        <TouchableOpacity
                          onPress={() => this.sortDisplayProducts()}
                          style={{ flexDirection:'row', alignItems: 'center', marginLeft: 10, padding: 7.5 }}
                        >
                          <FixedText>Sort By Name</FixedText>
                          <Icon
                            name={this.productDefaults.productSortDecending ? 'caret-down' : 'caret-up'}
                            iconStyle={{ marginLeft: 5, color: '#50585E' }}
                            size={14}
                            type={'font-awesome'}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.productsContainer}>
                        {/* These two Flatlists are identical but swapping large data on setState is slow. This is about 1s faster */}
                        {this.productDefaults.companyFavoriteClicked && 
                          <FlatList
                            extraData={[{
                              product: this.state.product
                            }]}
                            data={displayProducts}
                            renderItem={this.renderProductCard}
                            keyExtractor={(item) => item.mobile_id.toString()}
                            initialNumToRender={5}
                            removeClippedSubviews
                            numColumns={4}
                            windowSize={5}
                          />
                        }
                        {!this.productDefaults.companyFavoriteClicked && 
                          <FlatList
                            extraData={[{
                              product: this.state.product
                            }]}
                            data={displayProducts}
                            renderItem={this.renderProductCard}
                            keyExtractor={(item) => item.mobile_id.toString()}
                            initialNumToRender={5}
                            removeClippedSubviews
                            numColumns={4}
                            windowSize={5}
                          />
                        }
                      </View>
                    </View>

                  }

                  {(displayProducts.length === 0 && this.productDefaults.productSearchText && !this.state.searching && this.state.searchActive) &&

                    <FixedText style={[GS.redHeader, GS.p10, GS.pt20]}>No products found based on your search</FixedText>

                  }

                  {this.state.searching &&

                    <ActivityIndicator style={{ marginTop: 35 }} size="large" color="grey" />

                  }

                </ScrollView>
              </View>
            </View>
          </View>

        </View>

        <BottomBar>
          <View style={{ flex: 1 }} />
          <View style={{ flex: -1 }}>
            <ActionButton
              alt
              title={"cancel"}
              onPress={() => this.backTo(true)}
            />
          </View>

          <View style={{ flex: -1 }}>
            <ActionButton
              icon={'plus'}
              title={"Create"}
              onPress={this.addProduct}
            />
          </View>
        </BottomBar>

      </Form>
    );
  }
}

const styles = StyleSheet.create({
  topBarContainer: {
    minHeight: 55,
    ...GS.row,
    marginTop: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  productsContainer: {
    flexWrap: 'wrap',
    ...GS.rowGrow,
  },

  sidebarContainer: {
    flex: 1,
    borderTopWidth: 2,
    borderColor: '#E2E7EA',
    borderTopRightRadius: 5,
    paddingTop: -1,
  },

  mainContainer: {
    ...GS.flex3,
  },

  headerText: {
    paddingHorizontal: 10,
    paddingVertical: 40,
    fontSize: 18,
    textAlign: 'center',
    alignSelf: 'center',
    ...GS.darkestGray,
    ...GS.centered,
  },

  productCardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  }
});

ProductForm.propTypes = {
  existingFixture: PropTypes.object,
  project: PropTypes.shape({ mobile_id: PropTypes.number }).isRequired,
  changeStack: PropTypes.func.isRequired,
};

function mapStateToProps(state, props) {
  return {
    productDefaults: state.currentUserReducer.productDefaults,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ProductForm);
