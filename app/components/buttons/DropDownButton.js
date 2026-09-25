import React, { Component } from 'react';
import { Icon, Button } from 'react-native-elements';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import FixedText from '../general/FixedText';
import { GS, DARKER_GRAY, PRIMARY_BLUE } from './../../resources/styles/globals';

class DropDownButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  componentDidMount() {
  }

  renderMenuOptions() {
    menuOptions = []
    
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={() => this.props.mainButtonFunction()}
          style={styles.mainButton}
        >
          <FixedText style={styles.textStyle}>{this.props.mainButtonText}</FixedText>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  mainButton: {
    backgroundColor: PRIMARY_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5
  },

  dropDownButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: DARKER_GRAY
  },

  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DropDownButton;
