import Model from '../model'
import { companySchema } from '../schema'
import realm from '../realm';

export class Company extends Model {

  static async createFromServer(company) {
    company = await this.prepareForRealm(company);
    this.create(company, true);
  }

  static async prepareForRealm(company) {
    company.server_id = company.id;
    delete company.id;
    company.mobile_id = await this.findOrNextMobileId(company.server_id)
    return company
  }

  get lightingTemplates() {
    return realm.objects('CompanyTemplate').filtered("company_id = $0 AND measure_type = 'lighting'", this.server_id)
  }

  get default_lighting_template(){
    return realm.objects('CompanyTemplate').filtered("company_id = $0 AND measure_type = 'lighting' AND default = true", this.server_id)[0]
  }

  get doorTemplates() {
    return realm.objects('CompanyTemplate').filtered("company_id = $0 AND measure_type = 'door'", this.server_id)
  }

  get default_door_template(){
    return realm.objects('CompanyTemplate').filtered("company_id = $0 AND measure_type = 'door' AND default = true", this.server_id)[0]
  }

  favoriteExistingLightings() {
    return realm.objects('ExistingLighting').filtered('active = true AND favorite_company_id = $0', this.server_id)
  }
}

Company.schema = companySchema;
