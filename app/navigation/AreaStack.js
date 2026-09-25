import React, { Component } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import Areas from '../screens/Areas';
import AreaForm from '../screens/AreaForm';
import Inventory from '../screens/Inventory';
import ProductForm from '../screens/ProductForm';
import ExistingFixtureForm from '../screens/ExistingFixtureForm';
import ExistingLightingsForm from '../screens/ExistingLightingsForm';
import FloorPlanForm from '../screens/FloorPlanForm';

class AreaStack extends Component {
  constructor(props) {
    super(props);

    this.state = {
      areaFormStack: 'area form',
      editingExistingFixture: null,
      editingArea: null,
      stack: props.stack,
      openExistingFixtureModal: false,
      allAttributes: props.project.ExistingLightingAttributesByTab() || [],
      existingLightingId: null,
      pinnable: null,
      pinnableSubType: null,
    };

    this.changeEditingArea = this.changeEditingArea.bind(this);
    this.changeStack = this.changeStack.bind(this);
    this.changeToExistingFixture = this.changeToExistingFixture.bind(this);
    this.openArea = this.openArea.bind(this);
    this.editAreaProduct = this.editAreaProduct.bind(this);
    this.backToEditingArea = this.backToEditingArea.bind(this);
    this.copyExistingLighting = this.copyExistingLighting.bind(this);
  }

  openArea(area) {
    this.setState({
      editingArea: area,
      stack: 'edit area',
    });
  }

  async changeStack(newStack, area, pinnable=null, pinnableSubType=null) {
    this.setState({
      editingArea: area || null,
      editingExistingFixture: null,
      openExistingFixtureModal: false,
      stack: newStack,
      existingLightingId: null,
      pinnable: pinnable,
      pinnableSubType: pinnableSubType,
    });
  }

  editAreaProduct(editingExistingFixture) {
    this.setState({
      editingExistingFixture,
      stack: 'area product form',
    })
  }

  backToEditingArea(area) {
    this.setState({
      stack: 'edit area',
      openExistingFixtureModal: false,
      existingLightingId: null,
      editingArea: area
    })
  }

  async changeEditingArea(editingArea, openExistingFixtureModal, existingLightingId) {
    await this.setState({ stack: 'loading' });
    await this.setState({ 
      editingArea,
      openExistingFixtureModal: openExistingFixtureModal ? true : false,
      existingLightingId: existingLightingId ? existingLightingId : null,
    }, () => {

      const alreadyOnAreas = this.props.stack === 'areas';
      if (alreadyOnAreas) {
        this.setState({ stack: 'edit area' });
        return;
      }

      if (this.props.stack === 'inventory') {
        if (this.props.homeRef && this.props.homeRef.current) {
          this.props.homeRef.current.setActiveTab(4);
        } else {
          this.props.changeSidebarTab(4);
        }
        this.setState({ stack: 'edit area' });
        return;
      }

      // If we get here, we were on some other stack, so ensure we switch to Areas.
      this.props.changeSidebarTab(4);
      this.setState({ stack: 'edit area' });

    })
  }

  async changeToExistingFixture(inventoryItem) {
    await this.setState({ stack: 'loading' });
    await this.setState({
      editingArea: inventoryItem.area,
      stack: 'inventory product form',
      editingExistingFixture: inventoryItem.fixture,
    });
  }

  async copyExistingLighting(existingLighting, fromFavorites, area) {
    existingLighting = existingLighting.toPlainObject();

    if (fromFavorites) {
      const customAttributes = JSON.parse(existingLighting.custom_attributes)
      for (const key in customAttributes) {
        const value = customAttributes[key];
        if (value) {
          this.state.allAttributes.map(attribute => {
            if (attribute.code_name == key && attribute.input_type == 'list') {
              customAttributes[key] = attribute.uuidFromLabel(value)
            }
          })
        }
      }
      existingLighting.custom_attributes = JSON.stringify(customAttributes)
    }
    await this.setState({ existingLighting, fromFavorites });
    this.changeStack('copy existing lighting form', area);
  }

  render() {
    const {
      areaFormStack,
      editingExistingFixture,
      editingArea,
      stack,
      openExistingFixtureModal,
      existingLighting,
      fromFavorites,
      existingLightingId,
      pinnable,
      pinnableSubType
    } = this.state;

    const project = this.props.project;

    switch (stack) {
      case 'areas':
        return (
          <Areas
            changeStack={this.changeStack}
            openArea={this.openArea}
            project={project}
          />
        );

      case 'new area':
        return (
          <AreaForm
            changeStack={this.changeStack}
            changeEditingArea={this.changeEditingArea}
            editAreaProduct={this.editAreaProduct}
            project={project}
            stack={areaFormStack}
          />
        );

      case 'edit area':
        return (
          <AreaForm
            area={editingArea}
            changeStack={this.changeStack}
            changeEditingArea={this.changeEditingArea}
            editingExistingFixture={editingExistingFixture}
            editAreaProduct={this.editAreaProduct}
            project={project}
            stack={areaFormStack}
            openExistingFixtureModal={openExistingFixtureModal}
            existingLightingId={existingLightingId}
          />
        );

      case 'inventory':
        return (
          <Inventory
            project={project}
            changeToExistingFixture={this.changeToExistingFixture}
            changeStack={this.changeStack}
          />
        );

      case 'inventory product form':
        return (
          <ExistingFixtureForm
            project={project}
            existingFixture={editingExistingFixture}
            backTo='inventory'
            changeEditingArea={this.changeEditingArea}
            changeStack={this.changeStack}
          />
        );

      case 'area product form':
        return (
          <ExistingFixtureForm
            project={project}
            existingFixture={editingExistingFixture}
            backTo='edit area'
            changeEditingArea={this.changeEditingArea}
            backToEditingArea={this.backToEditingArea}
            changeStack={this.changeStack}
          />
        );

      case 'new existing lighting form':
        return (
          <ExistingLightingsForm
            mode={'new'}
            existingLighting={null}
            changeStack={this.changeStack}
            changeEditingArea={this.changeEditingArea}
            project={project}
            area={editingArea}
          />
        );

      case 'copy existing lighting form':
        return (
          <ExistingLightingsForm
            mode={'copy'}
            existingLighting={existingLighting}
            changeStack={this.changeStack} // back to area with modal
            changeEditingArea={this.changeEditingArea} //(area, true) for modal
            project={project}
            area={editingArea}
            fromFavorites={fromFavorites}
          />
        );

      case 'retrolux favorites':
        return (
          <ProductForm
            // existingFixture={this.state.editingExistingFixture || null} // later release
            // backToInventory={this.backToInventory} // later release
            area={editingArea}
            project={project}
            changeStack={this.changeStack}
            editAreaProduct={this.editAreaProduct}
            copyExistingLighting={this.copyExistingLighting} // (existingLighting, fromFavorites, area)
            changeEditingArea={this.changeEditingArea} //(area, true) for modal
          />
        );

      case 'floorplan':
        return (
          <FloorPlanForm
            area={editingArea}
            currentPinnable={pinnable}
            currentPinnableSubType={pinnableSubType}
            project={project}
            changeEditingArea={this.changeEditingArea} //(area, true) for modal
            editAreaProduct={this.editAreaProduct}
          />
        );

      case 'loading':
        return <View />;

      default:
        return <View />;
    }
  }
}

AreaStack.propTypes = {
  project: PropTypes.shape({ mobile_id: PropTypes.number.isRequired }).isRequired,
  stack: PropTypes.string.isRequired,
};

export default AreaStack;
