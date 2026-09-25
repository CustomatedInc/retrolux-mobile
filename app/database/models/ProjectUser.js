import Model from '../model';
import realm from '../realm';
import { projectUserSchema } from '../schema'
import { Project } from  './Project';

export class ProjectUser extends Model {
  static async createAllFromServer(projectUsers) {
    for (const projectUser of projectUsers) {
      await this.createFromServer(projectUser)
    }
  }

  static async createFromServer(projectUser) {
    const preppedProjectUser = await this.prepareForRealm(projectUser)
    this.create(preppedProjectUser, true)
  }

  static async prepareForRealm(projectUser) {
    projectUser.server_id = projectUser.id;
    await delete projectUser.id;
    projectUser.mobile_id = await this.findOrNextMobileId(projectUser.server_id);
    const project = await Project.findServer(projectUser.project_id)
    projectUser.mobile_project_id = project.mobile_id
    return projectUser
  }

  static async deactivate_server_ids(serverIds) {
    for(const id of serverIds) {
      const existing_record = await this.findServer(id)
      if (!!existing_record) existing_record.setProp('active', false)
    }
  }
}

ProjectUser.schema = projectUserSchema;
