/*
 * Set measure_type for CompanyTemplates and default_lighting_template
 */
export default function migration47(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 47) {
    let newCompanyTemplates = newRealm.objects('CompanyTemplate');
    let oldCompanyTemplates = oldRealm.objects('CompanyTemplate');

    for (let i = 0; i < oldCompanyTemplates.length; i++) {
      const oldCompanyTemplate = oldCompanyTemplates[i];
      const newCompanyTemplate = newCompanyTemplates[i];
      if (oldCompanyTemplate.measure_type) { continue; }

      newCompanyTemplate.measure_type = 'lighting';
    }
  }

  if (oldRealm.schemaVersion < 47) {
    let newCompanies = newRealm.objects('Company')
    let oldCompanies = oldRealm.objects('Company')

    for (let i = 0; i < oldCompanies.length; i++) {
      const oldCompany = oldCompanies[i];
      const newCompany = newCompanies[i];
      if (oldCompany.default_lighting_template_id) { continue; }

      const template = newRealm.objects('CompanyTemplate').filtered("company_id = $0 AND name = $1", newCompany.server_id, 'Default Template')[0];
      newCompany.default_lighting_template_id = template ? template.id : null;
    }
  }
}
