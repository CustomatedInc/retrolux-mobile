import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import { DeleteButton, CopyButton, SetDefaultButton, EmptyMessage, TableCell, TableHeader, TableRow } from '../';

const HeatingIndex = (props) => {
  const {
    schedules,
    onEdit,
    onDeactivate,
    project,
    copyAction
  } = props;

  const HEADER_CELLS = [
    { flex: 1, textAlign: 'center', title: 'Default' },
    { flex: 4, title: 'Name' },
    { flex: 1, title: 'Annual Hours', textAlign: 'center' },
    { flex: 1, textAlign: 'center', title: 'Copy' },
    { flex: 1, textAlign: 'center', title: 'Delete' },
  ];

  if (schedules.length > 0) {
    return (
      <View style={{flex: 1}}>
        <TableHeader headerCells={HEADER_CELLS} />
        <ScrollView style={{flex: 1}}>
          {schedules.map(schedule => (
            <TableRow
              key={`heating_${schedule.mobile_id}`}
              altColor={false}
              bottomBorder
              onPressRow={() => onEdit(schedule)}
            >
              <TableCell alignItems="center" flex={1}>
                <SetDefaultButton
                  isChecked={schedule.mobile_id === project.mobile_heating_id}
                  onPress={() => schedule.makeDefault()}
                />
              </TableCell>
              <TableCell type="text" flex={4} text={schedule.name} />
              <TableCell
                type="text"
                flex={1}
                text={schedule.annualHours}
                alignItems="center"
              />
              <TableCell flex={1} alignItems="center">
                <CopyButton onPress={() => copyAction(schedule)} />
              </TableCell>
              <TableCell flex={1} alignItems="center">
                <DeleteButton onPress={() => onDeactivate(schedule)} />
              </TableCell>
            </TableRow>
          ))}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.emptyMessageContainer}>
      <EmptyMessage
        header={'No Heating Schedules Yet'}
        message="Press the '+ heating' button below to create one"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyMessageContainer: {
    flex: 1,
  },
});

HeatingIndex.propTypes = {
  schedules: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
};

export { HeatingIndex };
