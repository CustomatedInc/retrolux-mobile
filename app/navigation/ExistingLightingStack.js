import React, { Component } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import ExistingLightings from '../screens/ExistingLightings';
import ExistingLightingsForm from '../screens/ExistingLightingsForm';
import ProductForm from '../screens/ProductForm';
import { ExistingLighting } from '../database/models';

class ExistingLightingStack extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stack: props.stack, // default 'index'
      allAttributes: props.project.ExistingLightingAttributesByTab() || [],
      primaryAttributes: props.project.primaryExistingLightingAttributes() || [],
      additionalAttributes: props.project.additionalExistingLightingAttributes() || [],
    };

    this.changeStack = this.changeStack.bind(this);
    this.copyExistingLighting = this.copyExistingLighting.bind(this);
    this.editExistingLighting = this.editExistingLighting.bind(this);
  }

  async changeStack(newStack) {
    this.setState({ stack: newStack });
  }

  async copyExistingLighting(existingLighting, fromFavorites) {
    existingLighting = existingLighting.toPlainObject();

    if (existingLighting.code) {
      let numAndLetterSeperate = existingLighting.code.match(/[a-z]+|[^a-z]+/gi)
      let existingCode = existingLighting.code
      let existingCodes = this.props.project.activeExistingLightingsByCode.map(existingLighting => existingLighting.code)

      // Last Char Number
      if (!!parseInt(numAndLetterSeperate[numAndLetterSeperate.length - 1])) {
        num = parseInt(numAndLetterSeperate[numAndLetterSeperate.length - 1])
        numAndLetterSeperate[numAndLetterSeperate.length - 1] = num + 1
        existingLighting.code = numAndLetterSeperate.join('')

      // Last Char Letter
      } else {
        let valid = false
        let i = 1
        let newCode = ''

        while (valid == false) {
          newCode = existingLighting.code + `${i}`
          i++
          valid = existingCodes.indexOf(newCode) == -1
        }

        existingLighting.code = newCode
      }

      if (fromFavorites && existingCodes.indexOf(existingCode) == -1) {
        existingLighting.code = existingCode
      }

    } else {
      existingLighting.code = ExistingLighting.nextCode(this.props.project)
    }

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
    this.changeStack('copy');
  }

  async editExistingLighting(existingLighting) {
    existingLighting = existingLighting.toPlainObject();
    await this.setState({ existingLighting });
    this.changeStack('edit');
  }

  render() {
    const {
      existingLighting,
      allAttributes,
      primaryAttributes,
      additionalAttributes,
      stack,
      fromFavorites,
    } = this.state;

    const { project } = this.props;

    switch (stack) {
      case 'index':
        return (
          <ExistingLightings
            changeStack={this.changeStack}
            project={project}
            allAttributes={allAttributes}
            copyExistingLighting={this.copyExistingLighting}
            editExistingLighting={this.editExistingLighting}
          />
        );

      case 'new':
        return (
          <ExistingLightingsForm
            mode={stack}
            changeStack={this.changeStack}
            existingLighting={null}
            project={project}
            primaryAttributes={primaryAttributes}
            additionalAttributes={additionalAttributes}
            editExistingLighting={this.editExistingLighting}
          />
        );

      case 'copy':
        return (
          <ExistingLightingsForm
            mode={stack}
            changeStack={this.changeStack}
            existingLighting={existingLighting}
            project={project}
            primaryAttributes={primaryAttributes}
            additionalAttributes={additionalAttributes}
            fromFavorites={fromFavorites}
          />
        );

      case 'edit':
        return (
          <ExistingLightingsForm
            mode={stack}
            changeStack={this.changeStack}
            existingLighting={existingLighting}
            project={project}
            primaryAttributes={primaryAttributes}
            additionalAttributes={additionalAttributes}
            editExistingLighting={this.editExistingLighting}
          />
        );

      case 'retrolux favorites':
        return (
          <ProductForm
            project={project}
            changeStack={this.changeStack} // "index" for back to list
            copyExistingLighting={this.copyExistingLighting} // (existingLighting, fromFavorites)
            // backToInventory={this.backToInventory}
            // changeSidebarTab={this.props.changeSidebarTab}
          />
        );

      case 'loading':
        return <View />;

      default:
        return <View />;
    }
  }
}

ExistingLightingStack.propTypes = {
  project: PropTypes.shape({ mobile_id: PropTypes.number.isRequired }).isRequired,
  stack: PropTypes.string.isRequired,
};

export default ExistingLightingStack;
