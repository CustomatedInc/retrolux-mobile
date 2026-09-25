export default function migration02(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 2) {
    let oldProjects = oldRealm.objects('Project');
    let newProjects = newRealm.objects('Project');
    for (let i = 0; i < oldProjects.length; i++) {
      newProjects[i].financing_debt_percentage = oldProjects[i].financing_debt_percentage ? oldProjects[i].financing_debt_percentage.toFixed(2) : null;
      newProjects[i].financing_interest_rate = oldProjects[i].financing_interest_rate ? oldProjects[i].financing_interest_rate.toFixed(2) : null;
      newProjects[i].incentive_max = oldProjects[i].incentive_max ? oldProjects[i].incentive_max.toFixed(2) : null;
      newProjects[i].maintenance_labor_rate = oldProjects[i].maintenance_labor_rate ? oldProjects[i].maintenance_labor_rate.toFixed(2) : null;
      newProjects[i].markup = oldProjects[i].markup ? oldProjects[i].markup.toFixed(2) : null;
      newProjects[i].probability = oldProjects[i].probability ? oldProjects[i].probability.toFixed(2) : null;
      newProjects[i].tax_rate = oldProjects[i].tax_rate ? oldProjects[i].tax_rate.toFixed(2) : null;
    }
    let oldExistingFixtures = oldRealm.objects('ExistingFixture');
    let newExistingFixtures = newRealm.objects('ExistingFixture');
    for (let i = 0; i < oldExistingFixtures.length; i++) {
      newExistingFixtures[i].annual_maintenance_cost = oldExistingFixtures[i].annual_maintenance_cost ? oldExistingFixtures[i].annual_maintenance_cost.toFixed(2) : null;
      newExistingFixtures[i].mounting_height = oldExistingFixtures[i].mounting_height ? oldExistingFixtures[i].mounting_height.toFixed(2) : null;
      newExistingFixtures[i].replacement_cost = oldExistingFixtures[i].replacement_cost ? oldExistingFixtures[i].replacement_cost.toFixed(2) : null;
    }
    let oldRateSchedules = oldRealm.objects('RateSchedule');
    let newRateSchedules = newRealm.objects('RateSchedule');
    for (let i = 0; i < oldRateSchedules.length; i++) {
      newRateSchedules[i].kwh_cost = oldRateSchedules[i].kwh_cost ? oldRateSchedules[i].kwh_cost.toFixed(2) : null;
    }
    let oldHeatings = oldRealm.objects('Heating');
    let newHeatings = newRealm.objects('Heating');
    for (let i = 0; i < oldHeatings.length; i++) {
      newHeatings[i].annual_run_time = oldHeatings[i].annual_run_time ? oldHeatings[i].annual_run_time.toFixed(2) : null;
      newHeatings[i].fuel_cost = oldHeatings[i].fuel_cost ? oldHeatings[i].fuel_cost.toFixed(2) : null;
      newHeatings[i].efficiency_value = oldHeatings[i].efficiency_value ? oldHeatings[i].efficiency_value.toFixed(2) : null;
    }
    let oldCoolings = oldRealm.objects('Cooling');
    let newCoolings = newRealm.objects('Cooling');
    for (let i = 0; i < oldCoolings.length; i++) {
      newCoolings[i].annual_run_time = oldCoolings[i].annual_run_time ? oldCoolings[i].annual_run_time.toFixed(2) : null;
      newCoolings[i].fuel_cost = oldCoolings[i].fuel_cost ? oldCoolings[i].fuel_cost.toFixed(2) : null;
      newCoolings[i].efficiency_value = oldCoolings[i].efficiency_value ? oldCoolings[i].efficiency_value.toFixed(2) : null;
    }
  }
}
