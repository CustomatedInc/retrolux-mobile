import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import FixedText from '../general/FixedText';
import { GS, PRIMARY_BLUE, BLACK_GRAY, MID_GRAY } from '../../resources/styles/globals';
import { titleize } from '../../lib/numberHelpers';

class ClickableInput extends Component {

  constructor(props) {
    super(props);

    if (props.attribute) {
      topThreeListItems = props.attribute.listItems() || [];
    } else if (props.listItems) {
      topThreeListItems = props.listItems;
    } else {
      topThreeListItems = [];
    }

    this.state = {
      topThreeListItems: topThreeListItems,
      width: 0,
    };
  }

  renderText() {
    const { title, placeholder } = this.props;

    if (!title && placeholder) {
      return <FixedText numberOfLines={1} style={{ color: "#d7d7db" }} >{placeholder}</FixedText>
    } else if (title) {
      return <FixedText numberOfLines={10}>{title}</FixedText>
    } else {
      return <FixedText style={{ color: "#d7d7db" }} >{'select'}</FixedText>
    }
  }

  renderHintOrError() {
    const { hint, error, errorMessage } = this.props;

    if (error){
      return <FixedText style={{ color: 'red', marginHorizontal: 20, marginTop: 2, fontStyle: 'italic', fontSize: 12 }}>{'*' + errorMessage}</FixedText>;
    } else if (hint) {
      return <FixedText style={{ color: '#3E4D53', marginHorizontal: 20, marginTop: 2, fontStyle: 'italic', fontSize: 12 }}>{hint}</FixedText>
    } else {
      return <View/>
    }
  }

  renderTopThree() {
    const { title, target } = this.props;
    topThree = [];

    if (!!this.state.topThreeListItems) {
      for (let i = 0; i < 3; i++) {
        if (this.state.topThreeListItems[i]) {
          const topThreeListItem = this.state.topThreeListItems[i];
          const value = topThreeListItem.uuid ? topThreeListItem.uuid : topThreeListItem; // either custom_attribute or classicAttribute
          const label = topThreeListItem.label ? topThreeListItem.label : titleize(topThreeListItem);
          topThree.push(
            <TouchableOpacity key={i}
              style={[styles.favoritButton, { marginHorizontal: i == 1 ? 7.5 : 0, backgroundColor: title == label ? PRIMARY_BLUE : 'white' }]}
              onPress={() => {
                this.props.topThreeSetAttribute(target, value)
              }}>
              <FixedText numberOfLines={2} style={{fontSize: 9, textAlign: 'center', color: title == label ? 'white' : BLACK_GRAY }}>{label}</FixedText>
            </TouchableOpacity>
          )
        }
      }
    }

    // render filler for correct layout
    if (topThree.length % 3 == 2){
      topThree.push(
        <TouchableOpacity key={'filler'}
          style={{ flex: 1, height: 26.5 }}
          onPress={() => { null }}>
        </TouchableOpacity>
      )
    }
    return topThree;
  }

  render() {
    return (
      <View>
        <TouchableOpacity onPress={this.props.onPress} style={[styles.inputStyle, {borderColor: this.props.error ? 'red' : MID_GRAY}]}>
          {this.renderText()}
        </TouchableOpacity>
        {this.renderHintOrError()}
        <View style={styles.favButtonHolder}>
          {this.renderTopThree()}
        </View>
      </View>
    );
  }
  
};

const styles = StyleSheet.create({
  inputStyle: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 5,
    paddingVertical: 9,
    marginBottom: 0,
    marginTop: 7.5,
    marginHorizontal: 20,
    ...GS.borderThin,
    ...GS.borderRounded,
  },

  favoritButton: {
    flex: 1,
    padding: 2.5,
    ...GS.center,
    ...GS.borderRounded,
    ...GS.borderThin,
    height: 26.5,
  },

  favButtonHolder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginHorizontal: 20
  },
});

ClickableInput.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default ClickableInput;
