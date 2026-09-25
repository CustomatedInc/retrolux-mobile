import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import { DeleteButton, CopyButton, SetDefaultButton, EmptyMessage, TableCell, TableHeader, TableRow } from '../';
import { formatLargeNumber } from '../../lib/numberHelpers';
import { RateSchedule } from '../../database/models';
import { roundTo, presentOrZero } from "../../lib/numberHelpers";

const RateIndex = (props) => {
  const {
    schedules,
    onEdit,
    onDeactivate,
    project,
    copyAction
  } = props;

  const HEADER_CELLS = [
    { flex: 1, textAlign: 'center', title: 'Default' },
    { flex: 2, title: 'Name' },
    { flex: 1, title: 'Type', textAlign: 'center' },
    { flex: 1, title: 'Customer\n($/Month)', textAlign: 'center' },
    { flex: 1, title: 'Energy\n($/kWh)', textAlign: 'center' },
    { flex: 1, title: 'Demand\n($/kW)', textAlign: 'center' },
    { flex: 1, title: 'Demand\nReduction', textAlign: 'center' },
    { flex: 1, title: 'Rate\nEscalation', textAlign: 'center' },
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
              key={`operating_${schedule.mobile_id}`}
              altColor={false}
              bottomBorder
              onPressRow={() => onEdit(schedule)}
            >
              <TableCell alignItems="center" flex={1}>
                <SetDefaultButton
                  isChecked={schedule.mobile_id === project.mobile_rate_schedule_id}
                  onPress={() => schedule.makeDefault()}
                />
              </TableCell>
              <TableCell type="text" flex={2} text={schedule.name} />
              <TableCell type="text" flex={1} text={schedule.rate_type} alignItems="center" />
              <TableCell type="text" flex={1} text={(presentOrZero(schedule.rate_customer) && schedule.rate_type == 'simple') ? `$${formatLargeNumber(roundTo(schedule.rate_customer, 2))}` : ''} alignItems="center" />
              <TableCell type="text" flex={1} text={`$${formatLargeNumber(RateSchedule.energyCost(schedule))}`} alignItems="center" />
              <TableCell type="text" flex={1} text={(presentOrZero(schedule.kw_demand_cost) && schedule.rate_type == 'simple') ? `$${formatLargeNumber(roundTo(schedule.kw_demand_cost, 2))}` : ''} alignItems="center" />
              <TableCell type="text" flex={1} text={(presentOrZero(schedule.demand_utilization) && schedule.rate_type == 'simple') ? `${formatLargeNumber(schedule.demand_utilization)}%` : ''} alignItems="center" />
              <TableCell type="text" flex={1} text={presentOrZero(schedule.rate_escalator) ? `${formatLargeNumber(roundTo(schedule.rate_escalator, 2))}%` : ''} alignItems="center" />
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
        header={'No Rate Schedules Yet'}
        message="Press the '+ rate schedule' button below to create one"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyMessageContainer: {
    flex: 1,
  },
});

RateIndex.propTypes = {
  schedules: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
};

export { RateIndex };
