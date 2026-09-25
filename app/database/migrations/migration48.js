/*
 * Set measure_types for all existing Projects/Companies
 */
export default function migration48(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 48) {
    let newProjects = newRealm.objects('Project')
    let oldProjects = oldRealm.objects('Project')

    for (let i = 0; i < oldProjects.length; i++) {
      const oldProject = oldProjects[i];
      const newProject = newProjects[i];
      newProject.measure_types.push('lighting');
    }
  }

  if (oldRealm.schemaVersion < 48) {
    let newCompanies = newRealm.objects('Company')
    let oldCompanies = oldRealm.objects('Company')

    for (let i = 0; i < oldCompanies.length; i++) {
      const oldCompany = oldCompanies[i];
      const newCompany = newCompanies[i];
      newCompany.measure_types.push('lighting');
    }
  }
}
