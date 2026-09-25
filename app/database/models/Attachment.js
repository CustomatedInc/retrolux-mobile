import Model from '../model';
import realm from '../realm';
import { attachmentSchema } from '../schema'
import UUIDGenerator from 'react-native-uuid-generator';
import * as appConstants from "../../resources/constants";
import { RNS3 } from 'react-native-aws3';
import { utcNow } from '../../lib/dateHelpers';

const RNFS = require('react-native-fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: appConstants.AWS_ACCESS_KEY,
  secretAccessKey: appConstants.AWS_SECRET_KEY,
  region: appConstants.AWS_REGION,
});

export class Attachment extends Model {

  static async deleteByAttachable(attachableType, attachableMobileId) {
    let attachments = await realm.objects('Attachment').filtered(`attachable_type = $0 AND attachable_mobile_id = $1`, attachableType, attachableMobileId)
    for (let i = 0; i < attachments.length; i++) {
      await attachments[i].delete()
    }
  }

  static async createAllFromServer(serverAttachments) {
    const preppedAttachments = []
    for (let index = 0; index < serverAttachments.length; index++) {
      const serverAttachment = serverAttachments[index];
      const found = await Attachment.findServer(serverAttachment.id);

      if (!serverAttachment.file.url) { continue }

      if (!found || !found.mobile_uri) {
        let mobileURI = await this.downloadFile(serverAttachment.file.url);
        // console.log("downloadFile Count --->> ", index+1);
        
        if (!mobileURI) { continue }
        serverAttachment.mobile_uri = mobileURI;
      }

      const preppedAttachment = await this.prepareForRealm(serverAttachment);

      if (!found) { preppedAttachment.mobile_id = preppedAttachment.mobile_id + index }
      preppedAttachments.push(preppedAttachment);
    }

    await this.create(preppedAttachments, true);
  }

  getClassName() {
    return 'Attachment';
  }

  static getClassName() {
    return 'Attachment';
  }

  getPin(pinnable_sub_type) {
    return (
      realm.objects('Pin').filtered(`active = true AND pinnable_type = 'Attachment' AND pinnable_sub_type = '${pinnable_sub_type}' AND mobile_pinnable_id = $0`, this.mobile_id)[0]
    )
  }


  static async prepareForRealm(attachment) {
    delete attachment.file;
    attachment.server_id = attachment.id;
    delete attachment.id;
    let found = await Attachment.findServer(attachment.server_id);
    attachment.mobile_id = await this.findOrNextMobileId(attachment.server_id);
    attachment.edited = !!found ? found.edited : false;
    attachment.created_at = attachment.created_at ? new Date(attachment.created_at) : null;
    attachment.updated_at = attachment.updated_at ? new Date(attachment.updated_at) : null;
    attachment.inactive_at = attachment.inactive_at ? new Date(attachment.inactive_at) : null;
    attachment.description = attachment.notes;
    delete attachment.meta;
    let attachableRecord = await realm.objects(attachment.attachable_type).filtered(`server_id = ${attachment.attachable_id}`)[0];
    if(!attachableRecord) { throw `No attachable found for attachment with id: ${attachment.server_id}` };
    attachment.attachable_mobile_id = attachableRecord.mobile_id;
    return attachment;
  }

  static async downloadFile(awsUrl) {
    let ext = await this.getExt(awsUrl);
    if (!ext) { return false }

    let uuid = await UUIDGenerator.getRandomUUID();
    let destinationPath = RNFS.DocumentDirectoryPath + '/' + uuid + '.' + ext;
    let download = await RNFS.downloadFile({ fromUrl: awsUrl, toFile: destinationPath });
    let response = await download.promise;

    if (response.statusCode == 200) {
      return destinationPath;
    } else {
      throw `File download from S3 failed for the attachment located at: ${awsUrl}`;
    }
  }

  static async getExt(awsUrl) {
    let lowerAwsUrl = awsUrl.toLowerCase();

    if (lowerAwsUrl.indexOf(".jpg?") != -1) { return "jpg" }
    else if (lowerAwsUrl.indexOf(".jpeg?") != -1) { return "jpeg" }
    else if (lowerAwsUrl.indexOf(".png?") != -1) { return "png" }
    else if (lowerAwsUrl.indexOf(".gif?") != -1) { return "gif" }
    // .csv .docx .doc .pdf etc
    else { return false }
  }

  static findAllByAttachable(type, attachable_mobile_id) {
    return realm.objects(this.schema.name).filtered('attachable_type = $0', type).filtered('attachable_mobile_id = $0', attachable_mobile_id)
  }

//:- Upload attachements in parallel
  static async uploadToAws() {
    const attachments = await realm.objects('Attachment').filtered('server_id = null');
    // console.log("AWS total attachments .. ", attachments.length);

    if (attachments.length === 0) return;

    const uuidPromises = attachments.map(() => UUIDGenerator.getRandomUUID()); 
    const uuids = await Promise.all(uuidPromises); // Generate UUIDs in parallel

    let options = {
      acl: 'private',
      bucket: appConstants.AWS_BUCKET,
      region: appConstants.AWS_REGION,
      accessKey: appConstants.AWS_ACCESS_KEY,
      secretKey: appConstants.AWS_SECRET_KEY,
      successActionStatus: 201
    };

    // Prepare file upload promises
    const uploadPromises = attachments.map(async (attachment, index) => {
      let uuid = uuids[index];
      let correctUri = await attachment.correctUri;
      let file = { uri: correctUri, name: 'mobile_photo.jpg', type: "image/jpeg" };

      let s3Options = { ...options, keyPrefix: `uploads/attachment/photo/${uuid}/` };
      let response = await RNS3.put(file, s3Options); // Upload in parallel

      if (response.status !== 201) throw new Error('File upload to AWS failed');

      let key = response.body.postResponse.key;
      let newPath = await s3.getSignedUrl('getObject', { Bucket: appConstants.AWS_BUCKET, Key: key });

      return { file: newPath, aws_key: key };
    });

    // Wait for all uploads to complete
    const uploadedFiles = await Promise.all(uploadPromises);

    // Update Realm DB in a single write transaction
    await realm.write(() => {
      attachments.forEach((attachment, index) => {
        attachment.file = uploadedFiles[index].file;
        attachment.aws_key = uploadedFiles[index].aws_key;
      });
    });
  }

  static async uploadToAwsInBatch() {
    const attachments = await realm.objects('Attachment').filtered('server_id = null');
    // console.log("AWS total attachments .. ", attachments.length);

    if (attachments.length === 0) return;

    const uuidPromises = attachments.map(() => UUIDGenerator.getRandomUUID());
    const uuids = await Promise.all(uuidPromises);

    let options = {
      acl: 'private',
      bucket: appConstants.AWS_BUCKET,
      region: appConstants.AWS_REGION,
      accessKey: appConstants.AWS_ACCESS_KEY,
      secretKey: appConstants.AWS_SECRET_KEY,
      successActionStatus: 201
    };

    const BATCH_SIZE = 200;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000; // 3 seconds delay before retry

    let uploadedFiles = [];
    let failedUploads = [];

    // 🔹 Function to handle upload with retries
    async function uploadWithRetry(attachment, uuid, index) {
      let attempts = 0;

      while (attempts < MAX_RETRIES) {
        try {
          let correctUri = await attachment.correctUri;
          let file = { uri: correctUri, name: 'mobile_photo.jpg', type: "image/jpeg" };
          let s3Options = { ...options, keyPrefix: `uploads/attachment/photo/${uuid}/` };

          let response = await RNS3.put(file, s3Options);
          // console.log(`Image response status: ${response.status}`);

          if (response.status !== 201) {
            // console.log(`Images response Error: ${response.status}  index: ${i + index}`);
            throw new Error(`File upload to AWS failed at index ${index}`);
          }

          let key = response.body.postResponse.key;
          let newPath = await s3.getSignedUrl('getObject', { Bucket: appConstants.AWS_BUCKET, Key: key });

          // console.log(`Uploaded successfully: index: ${index}`);
          return { file: newPath, aws_key: key };

        } catch (error) {
          attempts++;
          // console.log(`Upload failed at index ${index}, Attempt ${attempts}/${MAX_RETRIES}, Error: ${error.message}`);
          
          if (attempts < MAX_RETRIES) {
            // console.log(`Retrying index ${index} in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)); // Wait before retry
          } else {
            // console.log(`Max retries reached. Skipping index: ${index}`);
            return null;
          }
        }
      }
    }

    // 🔹 Process uploads in batches
    for (let i = 0; i < attachments.length; i += BATCH_SIZE) {
      let batch = attachments.slice(i, i + BATCH_SIZE);
      // console.log(`Processing batch: ${i / BATCH_SIZE + 1} with ${batch.length} attachments`);

      let uploadPromises = batch.map((attachment, index) =>
        uploadWithRetry(attachment, uuids[i + index], i + index)
      );

      let batchResults = await Promise.all(uploadPromises);
      // console.log(`API batchResults: ${batchResults.length}`);

      uploadedFiles.push(...batchResults.filter(res => res !== null)); // Store successful uploads
      failedUploads.push(...batchResults.filter(res => res === null)); // Store failed uploads
    }

    // console.log(`Upload completed. Success: ${uploadedFiles.length}, Failed: ${failedUploads.length}`);

    // 🔹 Update Realm DB in a single write transaction
    await realm.write(() => {
      attachments.forEach((attachment, index) => {
        if (uploadedFiles[index]) {
          attachment.file = uploadedFiles[index].file;
          attachment.aws_key = uploadedFiles[index].aws_key;
        }
      });
    });
  }

  async prepareForApi() {
    attachment = await this.toPlainObject()
    attachment['pins'] = []

    const allPins = await this.sync_pins
    if (!!allPins) {
      for (let i = 0; i < allPins.length; i++) {
        const pin = allPins[i];
        const plainPinObject = await pin.toPlainObject()
        plainPinObject['layer_uuid'] = await pin.layer.uuid
        attachment['pins'].push(plainPinObject);
      }
    }

    return JSON.stringify(attachment)
  }

  static async deleteAll() {
    let attachments = await realm.objects(this.schema.name)
    for (let i = 0; i < attachments.length; i++) {
      await attachments[i].delete()
    }
  }

  async delete() {
    let mobile_uri = await this.correctUri
    let fileExists = await RNFS.exists(mobile_uri)
    if (fileExists) { await RNFS.unlink(mobile_uri) } // delete photo/doc from disk

    pin = await this.pin
    if (!!pin) {
      await pin.deactivate();
    }

    realm.write(() => { realm.delete(this); }) // delete realm record
  }

  async deactivate() {
    pin = await this.pin
    if (!!pin) {
      await pin.deactivate();
    }

    await realm.write(() => {
      if (this.server_id || this.attachable_type == 'FloorPlan') { // if already on web toggle active
        realm.create('Attachment', {
          mobile_id: this.mobile_id,
          active: false,
          inactive_at: utcNow(),
          edited: true,
        }, true);
      } else { // if not on web do not sync. remove from realm.
        realm.delete(this);
      }
    });
  }

  get correctUri() {
   let splitUri = this.mobile_uri.split("/");
   let fileName = splitUri[splitUri.length - 1];
   return RNFS.DocumentDirectoryPath + "/" + fileName;
  }

  get attachable() {
    return realm.objects(this.attachable_type).filtered(`active = true AND mobile_id = $0`, this.attachable_mobile_id)[0]
  }

  /////////////////////////////////////////////////////////////
  ////////////////// FloorPlan GET functions //////////////////
  /////////////////////////////////////////////////////////////

  get mapping_style() {
    if (this.attachable_type != 'Area' ) { return false; }
    if (!!this.attachable.findFloorPlan) {
      if (!!this.pin) {
        return  '#33CF6C';
      } else {
        return '#ffc107';
      }
    } else {
      return false;
    }
  }

  get pin() {
    return (
      realm.objects('Pin').filtered(`active = true AND pinnable_type = 'Attachment' AND mobile_pinnable_id = $0`, this.mobile_id)[0]
    )
  }

  get sync_pins() {
    return (
      realm.objects('Pin').filtered(`pinnable_type = 'Attachment' AND mobile_pinnable_id = $0`, this.mobile_id)
    )
  }
}

Attachment.schema = attachmentSchema;
