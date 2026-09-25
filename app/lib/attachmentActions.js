/**
 * NOTICE:
 *  The methods in this file are being migrated to 'database/models/Attachment.js'
 *  No new methods should be added to this file
 */

import * as appConstants from "../resources/constants";
import { RNS3 } from 'react-native-aws3';
import realm from '../database/realm'
import UUIDGenerator from 'react-native-uuid-generator';
import { Attachment } from '../database/models';
// import ImageResizer from 'react-native-image-resizer';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const RNFS = require('react-native-fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: appConstants.AWS_ACCESS_KEY,
    secretAccessKey: appConstants.AWS_SECRET_KEY,
    region: appConstants.AWS_REGION,
  }
);

class attachmentActions {
  getCorrectUri(storedUri) {
    let splitUri = storedUri.split("/");
    let fileName = splitUri[splitUri.length - 1];
    let newUri = RNFS.DocumentDirectoryPath + "/" + fileName;
    return newUri;
  }

  async createAttachment(type, attachable_mobile_id, mobile_uri) {
    const attachable = await realm.objects(type).filtered(`mobile_id = ${attachable_mobile_id}`)[0]
    const mobileId = await Attachment.nextId();
    let uuid = await UUIDGenerator.getRandomUUID();

    await Attachment.create({
      attachable_id: attachable.server_id,
      attachable_mobile_id: attachable_mobile_id,
      attachable_type: type,
      type: 'Attachment::Photo',
      active: true,
      edited: false,
      mobile_uri: mobile_uri,
      mobile_id: mobileId,
      uuid: uuid,
    })
  }

  async cameraRollToDisk(cameraRollUri, photoWidth, photoHeight, quality = 25) {
    let destinationPath = await RNFS.DocumentDirectoryPath
    console.log('cameraRollUri ',cameraRollUri,'photoWidth ',photoWidth,'photoHeight ',photoHeight,'destinationPath ',destinationPath)
    let response = await ImageResizer.createResizedImage(cameraRollUri, photoWidth, photoHeight, 'JPEG', quality, 0, destinationPath, keepMeta = true)
    console.log('cameraRollToDisk ===> ',response)
    return response.path;
  }

  async delete(attachment) {
    let path = await this.getCorrectUri(attachment.mobile_uri);
    let fileExists = await RNFS.exists(path)
    if (fileExists) { await RNFS.unlink(path) } // delete photo/doc from disk
    realm.write(() => { realm.delete(attachment); }) // delete realm record
  }

  async deleteAll() {
    let attachments = await realm.objects('Attachment')
    for (let i = 0; i < attachments.length; i++) {
      await this.delete(attachments[i])
    }
  }

  async updateAttachmentServerIds(attachmentUpdates) {
    // attachmentUpdates is an object taking the form:
    //   { '1': { server_id: 85, attachable_id: 900 } }
    // where '1' is the record's mobile ID
    //
    Object.entries(attachmentUpdates).forEach(
      ([mobile_id, updates]) => {
        realm.write(() => {
          realm.create('Attachment', {
            mobile_id: parseInt(mobile_id),
            server_id: updates.server_id,
            attachable_id: updates.attachable_id,
          }, true);
        });
      }
    );
  }

  async updateAttachmentMobileIds() {
    // until API v2, this is needed to refresh attachments mobile_id
    const attachments = await realm.objects('Attachment').filtered('active = true')
    for (let i = 0; i < attachments.length; i++) {
      let attachment = attachments[i];
      if (!attachment.attachable_id) {
        attachment.deactivate()
        continue;
      }

      let attachableRecord = await realm.objects(attachment.attachable_type).filtered(`server_id = ${attachment.attachable_id}`)[0]
      if (!attachableRecord) {
        attachment.deactivate()
        continue;
      }

      realm.write(() => {
        realm.create('Attachment', {
          mobile_id: attachment.mobile_id,
          attachable_mobile_id: attachableRecord.mobile_id,
        }, true);
      });
    }
  }
}

export default new attachmentActions;
