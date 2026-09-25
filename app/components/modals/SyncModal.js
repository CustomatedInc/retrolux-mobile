import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Icon } from 'react-native-elements';
import Modal from 'react-native-modal';

import { StatusMessage, WarningMessage } from '../'
import { GS, DARKEST_GRAY, PRIMARY_BLUE, LIGHT_GREEN, RED, DARK_YELLOW } from '../../resources/styles/globals.js';

const retroluxLogoSource = require('../../resources/images/logo.png');

const SyncModal = props => {

  const {
    setSyncStatus,
    syncStatus,
    refreshSyncStatus,
    companiesSyncStatus,
    categoryTreeSyncStatus,
    existingLightingsSyncStatus,
    uploadProjectsSyncStatus,
    projectsSyncStatus,
    attachmentsSyncStatus,
    errorMsg,
    failedUpSyncProjects,
    failedDownSyncProjects,
    isLongSync,
    projectsToSyncCount,
    syncedProjects,
  } = props

  return (
    <Modal style={[styles.modalContainer, { width: Dimensions.get('window').width - 200 }]} isVisible={syncStatus != 'idle'}>
      <View style={styles.modal}>

        {/* Main Sync Message */}
        <View style={{flex: 3, justifyContent: 'center', alignItems: 'center'}}>
          <View style={styles.titleContainer}>
            {isLongSync && syncStatus === 'syncing' &&
              <WarningMessage
                message="This sync will need a few extra minutes to complete while we download lighting data for offline access."
                containerStyle={{ marginRight: 20, marginBottom: 0 }}
              />
            }

              <View style={[GS.p10, GS.m10]}>
                {chooseIcon(syncStatus)}
              </View>

              <Text style={styles.modalTitleText}>
                {modalTitles[syncStatus]}
              </Text>

              {/* Syncing Message */}
              {syncStatus == "syncing" &&
                <Text style={styles.messageTextStyle}>
                  Please do not close the app or navigate away from this page. You'll see a new message here when the sync completes.
                </Text>
              }

              {/* Complete Message */}
              {syncStatus == "complete" &&
                <Text style={styles.messageTextStyle}>
                  You're all up to date with app.retrolux.com
                </Text>
              }

              {/* Warning Messages */}
              {syncStatus == "warning" &&
                <Text style={styles.messageTextStyle}>
                  {failedUpSyncProjects.length > 0 &&
                    <Text style={styles.messageTextStyle}>
                      {`We had trouble uploading the following projects: ${failedUpSyncProjects.join(', ')}`}
                    </Text>
                  }
                  {failedDownSyncProjects.length > 0 &&
                    <Text style={styles.messageTextStyle}>
                      {`We had trouble downloading the following projects: ${failedDownSyncProjects.join(', ')}`}
                    </Text>
                  }
                  {attachmentsSyncStatus == "warning" &&
                    <Text style={styles.messageTextStyle}>
                      We had trouble uploading several of your photo attachments. If you continue to have problems, please contact Retrolux support.
                    </Text>
                  }
                </Text>
              }

              {/* Error Message */}
              {syncStatus == "error" &&
                <Text style={styles.messageTextStyle}>
                  {errorMsg}
                </Text>
              }

          </View>
        </View>

        {/* Right Status Bar */}

        <View style={styles.leftDivider}>
            <Text style={styles.statusTitleText}>
              Fetching
            </Text>

            {/* Status */}
            <StatusMessage title='companies' status={companiesSyncStatus} />
            <StatusMessage title='categories' status={categoryTreeSyncStatus} />
            <StatusMessage title='lighting data' status={existingLightingsSyncStatus} />
            <StatusMessage title='uploading projects' status={uploadProjectsSyncStatus} />
            <StatusMessage title='uploading attachments' status={attachmentsSyncStatus} />
            <StatusMessage title='getting projects' status={projectsSyncStatus}/>

            {/* Done Button */}
            {renderButton(syncStatus, refreshSyncStatus)}
        </View>
      </View>
    </Modal>
  )
}

export default SyncModal;

const modalTitles = {
  'syncing': 'Syncing',
  'complete': 'Complete',
  'warning': 'Incomplete Sync',
  'error': 'An Error Occurred'
};

// This is a way to get the error messages displaying correctly
// function renderProjectErrors(failedProjects) {
//   projectErrors = []

//   for (let i = 0; i < failedProjects.length; i++) {
//     const project = failedProjects[i];

//     specificErrors = []
//     for (const model in project.errors) {
//       if (project.errors.hasOwnProperty(model)) {
//         const errorGroup = project.errors[model];
//         errorGroup.forEach(error => {
//           specificErrors.push(
//             <Text key={`${error.name}-${i}`} style={{ fontSize: 14, marginTop: 10, color: DARKEST_GRAY, marginLeft: 40, marginRight: 20}}>
//               {`${model}: ${error.name} , error: ${error.error}`}
//             </Text>
//           )
//         });
//       }
//     }

//     projectErrors.push(
//       <View key={`${project.name}-${i}`}>
//         <Text style={styles.messageTextStyle}>
//           {`We had trouble uploading the following project: ${project.name}`}
//         </Text>
//         <View>
//           {specificErrors}
//         </View>
//       </View>
//     )
//   }

//   return projectErrors
// }

function chooseIcon(syncStatus) {
  switch (syncStatus) {
    case 'syncing':
      return <Image source={retroluxLogoSource} style={styles.retroluxLogo} />
    case 'complete':
      return <Icon name='check-circle' size={150} color={LIGHT_GREEN} />
    case 'warning':
      return <Icon name='warning' size={150} color={DARK_YELLOW} />
    case 'error':
      return <Icon name='error' size={150} color={RED} />
  }
}

function renderButton(syncStatus, refreshSyncStatus) {
  if (syncStatus !== 'syncing') {
    return(
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={refreshSyncStatus}
          style={styles.doneButtonBackground}
        >
          <Text style={styles.doneButtonText}> DONE </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  modal: {
    borderRadius: 8,
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'row',
  },

  modalContainer: {
    alignSelf: 'center',
    justifyContent: "center",
    marginVertical: 100,
    flex: 1,
  },

  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  modalTitleText: {
    fontSize: 45,
    marginBottom: 10,
    fontWeight: 'bold',
    color: DARKEST_GRAY,
  },

  statusTitleText: {
    fontSize: 25,
    marginBottom: 10,
    fontWeight: 'bold',
    color: DARKEST_GRAY,
  },

  leftDivider: {
    ...GS.borderLeft,
    paddingHorizontal: 25,
    flex: 2,
    marginVertical: 20
  },

  messageTextStyle: {
    lineHeight: 35,
    fontSize: 18,
    marginTop: 10,
    color: DARKEST_GRAY,
    marginHorizontal: 20,
  },

  doneButtonBackground: {
    width: "100%",
    margin: 8,
    borderRadius: 3,
    backgroundColor: PRIMARY_BLUE,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
    paddingHorizontal: 25,
    paddingVertical: 3
  },

  retroluxLogo: {
    resizeMode: 'contain',
    transform: [{ scale: 1 }],
  },

});
