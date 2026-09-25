import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import _ from 'lodash';

import { FixedText } from '../../components';
import { GS, GREEN } from '../../resources/styles/globals';

const TableHeader = props => {

  const {
    headerCells
  } = props

  const header = [];
  var headerIndex = 0;
  headerCells.forEach(function(headerCell) {
    header.push(
      <View
        key={headerIndex}
        style={{
          width: headerCell.type == 'button' ? 80 : null,
          flex: headerCell.type == 'button' ? -1 : headerCell.flex || 1,
          paddingLeft: (headerCell.textAlign || headerCell.title == '') ? 0 : 10,
        }}
      >
        {headerCell.onSort ?
          // Makes whole table header a clickable input for sorting
          <TouchableOpacity
            onPress={() => headerCell.onSort()}
            style={{ flexDirection:'row' }}
          >
            <FixedText
              style={[
                styles.headerText,
                { textAlign: headerCell.textAlign || 'left' },
              ]}
            >
              {headerCell.title}
            </FixedText>
            <Icon
              name={'sort'}
              iconStyle={{ marginLeft: 5, color: '#50585E' }}
              size={14}
              type={'font-awesome'}
            />

            {!!headerCell.sortedBy &&
              <Icon
                name={'check'}
                iconStyle={{ marginLeft: 5, color: GREEN }}
                size={14}
                type={'font-awesome'}
              />
            }

          </TouchableOpacity>

          :

          <FixedText
            style={[
              styles.headerText,
              { textAlign: headerCell.textAlign || 'left' },
            ]}
          >
            {headerCell.title}
          </FixedText>

        }

      </View>
    )
    headerIndex = headerIndex + 1;
  });

  return (
    <View style={styles.headerContainer}>
      {header}
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 5,
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop: 25,
    ...GS.borderBottom,
    ...GS.bgLightestGray,
    alignItems: 'center'
  },

  headerText: {
    fontWeight: 'bold',
    color: '#50585E',
  },
});

export default TableHeader;
