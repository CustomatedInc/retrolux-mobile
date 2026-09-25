import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import FixedText from './FixedText';
import { GS, DARKER_GRAY, DARKEST_GRAY, LIGHT_GREEN } from './../../resources/styles/globals';

const SearchBar = props => {
  const {
    value,
    onSearch,
    onChangeText,
    onClear,
    placeholder,
  } = props

  return (
    <View style={[styles.searchContainer]}>
      <View style={styles.searchSection}>
        <Icon style={styles.searchIcon} name="search" size={20} color={DARKER_GRAY} />
        <TextInput
          style={styles.searchInput}
          value={value}
          placeholder={placeholder}
          onChangeText={onChangeText}
          underlineColorAndroid="transparent"
        />
      </View>

      {onSearch &&
        <TouchableOpacity
          onPress={onSearch}
          style={styles.rightButton}
        >
          <FixedText style={styles.clearButtonText}>search</FixedText>
        </TouchableOpacity>
      }

      {onClear &&
        <TouchableOpacity
          onPress={onClear}
          style={styles.rightButton}
        >
          <FixedText style={styles.clearButtonText}>clear</FixedText>
        </TouchableOpacity>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  rightButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: DARKER_GRAY,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    ...GS.center,
  },

  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  searchContainer: {
    ...GS.flex1,
    ...GS.justify,
    ...GS.row,
  },

  searchSection: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRightWidth: 0,
    backgroundColor: 'white',
    ...GS.center,
    ...GS.pl10,
    ...GS.borderThin,
    ...GS.rowGrow,
  },

  searchIcon: {
    ...GS.mx10,
    ...GS.mr20,
  },

  searchInput: {
    backgroundColor: 'white',
    color: DARKEST_GRAY,
    fontSize: 16,
    ...GS.p10,
    paddingLeft: 0,
    ...GS.ml10,
    ...GS.flex1,
  },
});


export default SearchBar;
