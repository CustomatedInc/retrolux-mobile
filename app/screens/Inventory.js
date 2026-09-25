import React, { Component } from 'react';
import { Alert, StyleSheet, View, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { Icon } from 'react-native-elements';
import memoize from 'fast-memoize';
import { debounce } from 'lodash';
import { dateString } from '../lib/dateHelpers';
import realm from '../database/realm';
import { GS, GREEN } from '../resources/styles/globals';
import { TableCell, TableHeader, TableRow, DeleteButton, FloorPlanButton, SearchBar, TableActionBar, LocationScopeButton } from '../components';
import { Area } from '../database/models';
import attachmentActions from '../lib/attachmentActions';

const getFixtureProduct = memoize(fixture_mobile_existing_lighting_id => realm.objects('ExistingLighting').filtered(`mobile_id= ${fixture_mobile_existing_lighting_id} AND active = true`)[0]);

const getInventory = memoize((fixtures) => {
  const inventoryList = [];

  for (const fixture of fixtures) {
    const { mobile_existing_lighting_id } = fixture;
    const inventoryRow = {
      area: fixture.area.name_with_parents,
      fixture,
      product: getFixtureProduct(mobile_existing_lighting_id),
    };
    inventoryList.push(inventoryRow);
  }
  return inventoryList;
});

class Inventory extends Component {
  constructor(props) {
    super(props);

    const sortByType = 'created_at';
    const sortDescending = true;
    const inventory = getInventory(props.project.scoped_existing_fixtures);

    this.state = {
      inventory,
      search: null,
      sortDescending,
      sortByType,
    };

    this.resetInventory = this.resetInventory.bind(this);
    this.handleTextChange = debounce(text => this.setState({ search: text }), 250);
  }

  resetInventory() {
    const inventory = getInventory(this.props.project.scoped_existing_fixtures);
    this.setState({ inventory })
  }

  searchProducts = () => {
    const { search, sortByType, inventory } = this.state;
    if (!this.state.search) {
      this.resetInventory();
      return;
    }
    const bareText = search.toLowerCase().split(/[^A-Za-z0-9!?]/).filter(x => x); // splits on anything non digit or alphanumeric then .filter removes empty
    const matchingInventory = inventory.filter(({ product: { searchableName } }) => {
      const y = bareText.map(x => searchableName.includes(x));
      return y.includes(true);
    });

    if (sortByType == 'name') {
      var { inventory: sortedInventory } = this.sortByName(matchingInventory)
    } else if (sortByType == 'name_with_parents') {
      var { inventory: sortedInventory } = this.sortByAreaName(matchingInventory)
    } else {
      var { inventory: sortedInventory } = this.sortByCreatedAt(matchingInventory);
    }

    this.setState({
      ...this.state,
      inventory: sortedInventory,
    });
  }

  sortByName(inventory, toggle = null) {
    const { sortDescending } = this.state;
    const newSortDescending = toggle ? !sortDescending : sortDescending;

    inventory.sort(function (a, b) {
      const productA = a.product.name.toLowerCase();
      const productB = b.product.name.toLowerCase();

      if (newSortDescending) {
        return (productA < productB) ? 1 : -1; // true z->a
      }
      return (productA < productB) ? -1 : 1; // false a->z
    });

    return {
      sortDescending: newSortDescending,
      sortByType: 'name',
      inventory,
    };
  }

  sortByAreaName(inventory, toggle = null) {
    const { sortDescending } = this.state;
    const newSortDescending = toggle ? !sortDescending : sortDescending;

    inventory.sort(function (a, b) {
      const productA = a.area.toLowerCase();
      const productB = b.area.toLowerCase();

      if (newSortDescending) {
        return (productA < productB) ? 1 : -1; // true z->a
      }
      return (productA < productB) ? -1 : 1; // false a->z
    });

    return {
      sortDescending: newSortDescending,
      sortByType: 'name_with_parents',
      inventory,
    };
  }

  sortByCreatedAt(inventory, toggle = null) {
    const { sortDescending } = this.state;
    const newSortDescending = toggle ? !sortDescending : sortDescending;

    inventory.sort(function (a, b) {
      const productA = a.fixture.created_at;
      const productB = b.fixture.created_at;

      if (newSortDescending) {
        return (productA < productB) ? -1 : 1; // true oldest->newest
      }
      return (productA < productB) ? 1 : -1; // false newest->oldest
    });

    return {
      sortDescending: newSortDescending,
      sortByType: 'created_at',
      inventory,
    };
  }

  confirmDeactivation = inventoryRow => () => {
    Alert.alert(
      'Are You Sure?',
      'You cannot undo this action',
      [
        { text: 'Yes, delete it.', onPress: () => this.deactivateExistingProduct(inventoryRow.fixture), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: false },
    );
  }

  async deactivateExistingProduct(existingFixture) {
    await existingFixture.deactivate();

    this.resetInventory();
  }

  handleSort(type) {
    const { inventory } = this.state;
    if (type === 'name') {
      return () => {
        this.setState({
          ...this.state,
          ...this.sortByName(inventory, true),
        });
      };
    }

    else if (type == 'areaName') {
      return () => {
        this.setState({
          ...this.state,
          ...this.sortByAreaName(inventory, true),
        });
      };
    }

    return () => {
      this.setState({
        ...this.state,
        ...this.sortByCreatedAt(inventory, true),
      });
    };
  }

  handleRowPress(inventoryItem) {
    return () => this.props.changeToExistingFixture(inventoryItem);
  }

  handleFloorPlanButtonClick = (inventoryItem, area) => {
    const { fixture } = inventoryItem;
    return () => {
      this.props.changeStack('floorplan', area, fixture, 'existing_count');
    };
  }

  renderInventoryRow = ({ item: inventoryItem }, i) => {
    const { fixture: { area, audit_complete: complete, code, product_name, existing_count, created_at, mapping_style } } = inventoryItem;

    return (
      <TableRow onPressRow={this.handleRowPress(inventoryItem)} altColor={false} bottomBorder>
        <TableCell type="text" flex={1} alignItems="center" text={code} />
        <TableCell type="icon" flex={1} alignItems="center">
          <Icon
            name={complete ? 'check-circle' : 'times-circle'}
            iconStyle={{ color: complete ? GREEN : 'tomato' }}
            size={20}
            type={'font-awesome'}
          />
        </TableCell>
        <TableCell type="text" flex={4} text={product_name} />
        <TableCell type="text" flex={2.5} text={area.name_with_parents} />
        <TableCell type="text" flex={1} text={existing_count} alignItems="center" />
        <TableCell type="text" flex={2} text={dateString(created_at)} />
        <TableCell flex={1} alignItems="center">

          {area.findFloorPlan && (
            <FloorPlanButton mapStyle={mapping_style} onPress={this.handleFloorPlanButtonClick(inventoryItem, area)} />
          )}

        </TableCell>
        <TableCell flex={1} alignItems="center">
          <DeleteButton onPress={this.confirmDeactivation(inventoryItem)} />
        </TableCell>
      </TableRow>
    );
  }

  render() {
    const { search, inventory, sortByType } = this.state;
    return (
      <View style={styles.mainContainer}>
        <LocationScopeButton
          project={this.props.project}
        />
        <TableActionBar>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChangeText={this.handleTextChange}
              onSearch={this.searchProducts}
              placeholder="search for a product"
            />
          </View>
        </TableActionBar>
        <View style={{ flex: 15 }}>
          <View style={{ backgroundColor: '#FFFFFF' }}>
            <TableHeader
              headerCells={[
                { title: 'Code', flex: 1, textAlign: 'center' },
                { title: 'Complete', flex: 1, textAlign: 'center' },
                { title: 'Product', flex: 4, onSort: this.handleSort('name'), sortedBy: sortByType == 'name' },
                { title: 'Area Name', flex: 2.5, onSort: this.handleSort('areaName'), sortedBy: sortByType == 'name_with_parents' },
                { flex: 1, title: 'Count', textAlign: 'center' },
                { flex: 2, title: 'Created At', onSort: this.handleSort('createdAt'), sortedBy: sortByType == 'created_at' },
                { flex: 1, title: 'Mapping', textAlign: 'center' },
                { flex: 1, title: 'Delete', textAlign: 'center' },
              ]}
            />
          </View>
          <FlatList
            data={inventory}
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            renderItem={this.renderInventoryRow}
            keyExtractor={(item) => item.fixture.mobile_id.toString()}
            initialNumToRender={15}
            removeClippedSubviews
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    ...GS.flex1,
  },
});

Inventory.propTypes = {
  project: PropTypes.object.isRequired,
  changeToExistingFixture: PropTypes.func.isRequired,
};

export default Inventory;
