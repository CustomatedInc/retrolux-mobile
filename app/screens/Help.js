import React, {Component} from "react";
import {  View, Text, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createIconSetFromFontello } from 'react-native-vector-icons';
import DeviceInfo from 'react-native-device-info';

import { FormGroupLabel, FixedText, RLButton } from '../components'
import fontelloConfig from '../../config.json';
import { GS, MID_GRAY, DARKEST_GRAY, PRIMARY_BLUE, LIGHTER_BLUE, GREEN, RED } from '../resources/styles/globals';
import { version } from '../../package.json';
import { ENVIRONMENT_URL } from '../resources/constants'
import { ACCESS_TOKEN } from '../resources/constants';
import { sendDiagnostics } from '../api/syncs'

const CustomIcon = createIconSetFromFontello(fontelloConfig);

export default class Help extends Component {
  constructor(props) {
    super(props);

    this.state = {
      systemVersion: null,
      apiAuthToken: null,
      diagnosticsStatus: 'unsent',
    }
  }

  componentDidMount() {
    this.setupAsyncState()
  }

  async setupAsyncState() {
    const systemVersion = await DeviceInfo.getSystemVersion()
    const apiAuthToken = await AsyncStorage.getItem(ACCESS_TOKEN);

    this.setState({ systemVersion, apiAuthToken })
  }

  async sendDiagnostics() {
    if (!!this.state.apiAuthToken) {
      const success = await sendDiagnostics(this.state.apiAuthToken)
      this.setState({ diagnosticsStatus: success ? 'sent' : 'error' })
    } else {
      this.setState({ diagnosticsStatus: 'error' })
    }
  }

  render() {
    const { diagnosticsStatus } = this.state

    return(
      <View style={styles.container}>

        {/* Contact Us */}

        <View style={styles.headerContainer}>
          <CustomIcon name='retrolux' size={22} color={MID_GRAY} />
          <Text style={styles.headerText}> Contact Us </Text>
        </View>


        <View style={GS.row}>
          <FixedText style={styles.paragraph}>
            If you have any questions, please contact your account manager or email us at
          </FixedText>
          <FixedText style={styles.boldText}>
            support@retrolux.com
          </FixedText>
        </View>

        <FixedText style={styles.paragraph}>
          We also offer chat support. To chat with our support team,
          log in to your account at app.retrolux.com and select help from the sidebar.
        </FixedText>

        {/* Diagnostics */}

        <View style={[styles.headerContainer, styles.marginTop]}>
          <Text style={styles.icon}>
            &#xf0fa;
          </Text>
          <Text style={styles.headerText}> Diagnostics </Text>
        </View>

        <View style={GS.row}>
          <FixedText style={styles.paragraph}>
            Version:
          </FixedText>
          <FixedText style={styles.boldText}>
            Retrolux Pro, 2.0
          </FixedText>
        </View>

        <View style={GS.row}>
          <FixedText style={styles.paragraph}>
            iOS:
          </FixedText>
          <FixedText style={styles.boldText}>
            {this.state.systemVersion}
          </FixedText>
        </View>

        { !!ENVIRONMENT_URL && ENVIRONMENT_URL !== "https://app.retrolux.com" &&
          <View style={GS.row}>
            <FixedText style={styles.paragraph}>
              Env:
            </FixedText>
            <FixedText style={styles.boldText}>
              {ENVIRONMENT_URL}
            </FixedText>
          </View>
        }

        {/* Diagnostics Info Box */}

        <View style={styles.diagnosticsInfo}>
          <View style={styles.diagnosticsText}>
            <FixedText style={styles.diagnosticHeader}>
              Send Diagnostic Data
            </FixedText>
            <FixedText>
              One of our support engineers may ask you to send us device data that can help us diagnose
              a bug. This data may include user and audit information.
            </FixedText>
          </View>

          <View style={{ flex: -1, width: 170, ...GS.center }}>
            {diagnosticsStatus === 'unsent' &&
              <RLButton
                backgroundColor={GREEN}
                color='white'
                title="Send to Retrolux HQ"
                onPress={() => this.sendDiagnostics()}
              />
            }

            {diagnosticsStatus === 'sent' &&
              <View style={GS.row}>
                <Text style={[styles.icon, styles.success]}>
                  &#xf058;
                </Text>
                <Text style={[styles.success, styles.diagnosticsStatus]}>
                  success
                </Text>
              </View>
            }

            {diagnosticsStatus === 'error' &&
              <View style={GS.row}>
                <Text style={[styles.icon, styles.error]}>
                  &#xf057;
                </Text>
                <Text style={[styles.error, styles.diagnosticsStatus]}>
                  error
                </Text>
              </View>
            }
          </View>

        </View>

      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 25,
    paddingVertical: 20,
  },

  paragraph: {
    marginTop: 20,
    marginBottom: 1,
    fontSize: 16,
  },

  headerContainer: {
    flex: -1,
    flexDirection: 'row',
    paddingBottom: 3,
    ...GS.borderBottom,
  },

  headerText: {
    ...GS.grayHeading,
    marginLeft: 5,
  },

  boldText: {
    fontWeight: 'bold',
    color: PRIMARY_BLUE,
    marginTop: 20,
    marginLeft: 3,
    fontSize: 16,
  },

  icon: {
    fontFamily: 'fontawesome',
    fontSize: 20,
    color: MID_GRAY,
    marginRight: 2,
  },

  marginTop: {
    marginTop: 45,
  },

  diagnosticsInfo: {
    ...GS.bgLightestBlue,
    ...GS.borderRounded,
    borderWidth: 1,
    borderColor: LIGHTER_BLUE,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
  },

  diagnosticHeader: {
    fontWeight: 'bold',
    marginBottom: 10,
  },

  diagnosticsText: {
    flex: 1,
    paddingRight: 10,
  },

  diagnosticsStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  success: {
    color: GREEN,
  },

  error: {
    color: RED,
  },
});
