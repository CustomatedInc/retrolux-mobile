import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import { ClickableInput, FixedFormLabel, StringInput, NumberInput } from '../';
import { Icon } from 'react-native-elements';
import Placeholder from 'rn-placeholder';
import { DARKER_GRAY } from '../../resources/styles/globals';

class CustomAttributeFormElement extends Component {

  constructor(props) {
    super(props);

    this.state = {
      attribute: props.attribute,
      customAttributes: props.customAttributes,
      prevProps: {}
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevProps = prevState.prevProps || {};
    const customAttributes = prevProps.customAttributes != nextProps.customAttributes ? nextProps.customAttributes : prevState.customAttributes;
    return { prevProps: nextProps, customAttributes }
  }

  render() {
    const { customAttributes, attribute } = this.state;
    const { complexSetStateForCustomAttributes, formErrors, tooltips, placeholders, elementLayout, isReady } = this.props;

    if (attribute.code_name == "thermal_efficiency") { return <View/> }

    return(
      <View style={elementLayout}>
        <Placeholder.Box
          height={20}
          width="50%"
          radius={5}
          color="#ededf2"
          onReady={isReady}
          style={{ marginTop: 12.5 }}
        />
        <Placeholder.Box
          height={55}
          width="100%"
          radius={5}
          color="#ededf2"
          onReady={isReady}
          style={{ marginTop: 5 }}
        >
          <View>
            <View style={{flexDirection: 'row'}}>
              <FixedFormLabel labelStyle={{ marginTop: 8 }}>{attribute.label}</FixedFormLabel>
              {attribute.required_to_complete && <Text style={{ marginTop: 8, marginLeft: 5, color: 'tomato' }}>*</Text>}
              {tooltips && tooltips[attribute.code_name] &&
                <TouchableOpacity onPress={() => Alert.alert("Inheriting Value", tooltips[attribute.code_name])}>
                  <Icon name="info-circle" color={DARKER_GRAY} iconStyle={{marginTop: 8, marginLeft: 5}} size={12.5} type={'font-awesome'} />
                </TouchableOpacity>
              }
            </View>

            {(attribute.input_type === 'integer' || attribute.input_type === 'number') &&
              <NumberInput
                target={attribute.code_name}
                value={customAttributes ? customAttributes[attribute.code_name] : ''}
                placeholder={placeholders ? placeholders[attribute.code_name] : attribute.placeholder}
                hint={attribute.hint}
                unit={attribute.unit}
                unitPosition={attribute.unit_position}
                onChange={complexSetStateForCustomAttributes}
                error={!!formErrors[attribute.code_name]}
                errorMessage={formErrors[attribute.code_name]}
                integer={attribute.input_type === 'integer' ? true : false}
                quickList={attribute.quick_list}
              />
            }

            {attribute.input_type === 'list' &&
              <ClickableInput
                onPress={() => this.props.setCustomAttributeListModalVisible(true, attribute)}
                title={customAttributes[attribute.code_name] ? attribute.labelFromUuid(customAttributes[attribute.code_name]) : ''}
                placeholder={placeholders ? placeholders[attribute.code_name] : attribute.placeholder}
                hint={attribute.hint}
                topThreeSetAttribute={complexSetStateForCustomAttributes}
                attribute={attribute}
                target={attribute.code_name}
              />
            }

            {(attribute.input_type === 'text' || attribute.input_type === 'textbox') &&
              <StringInput
                multiline={attribute.input_type === 'textbox' ? true : false}
                label={null}
                value={customAttributes ? customAttributes[attribute.code_name] : ''}
                onChange={complexSetStateForCustomAttributes}
                target={attribute.code_name}
                placeholder={placeholders ? placeholders[attribute.code_name] : attribute.placeholder}
                hint={attribute.hint}
                defaultValue={attribute.defaultValue}
                error={!!formErrors[attribute.code_name]}
                errorMessage={formErrors[attribute.code_name]}
              />
            }
          </View>
        </Placeholder.Box>
      </View>
    )
  }
};

CustomAttributeFormElement.propTypes = {
  customAttributes: PropTypes.object.isRequired,
  formErrors: PropTypes.object.isRequired,
  complexSetStateForCustomAttributes: PropTypes.func.isRequired,
};

export default CustomAttributeFormElement;
