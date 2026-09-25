import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FixedText } from '../components';
import { TouchableOpacity, Image, ScrollView, StyleSheet, View } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import realm from '../database/realm';
import { Button } from 'react-native-elements';
import attachmentActions from '../lib/attachmentActions';
import { markEdited } from '../lib/realmActions';

export default class CameraRollBrowser extends Component {

  constructor(props) {
    super(props);

    this.state = {
      photos: [],
      photosLoaded: 20,
    };

    this.loadMorePhotos = this.loadMorePhotos.bind(this)
    this.attachPhoto = this.attachPhoto.bind(this)

    this.getPhotos()
  }

  async loadMorePhotos() {
    let photosLoaded = this.state.photosLoaded + 20;
    await this.setState({ photosLoaded: photosLoaded })
    this.getPhotos()
  }

  async getPhotos() {
    photos = await CameraRoll.getPhotos({
      first: this.state.photosLoaded,
      assetType: 'All'
    })
    await this.setState({ photos: photos.edges })
  }

  async attachPhoto(cameraRollUri, photoWidth, photoHeight) {
    let diskLocation = await attachmentActions.cameraRollToDisk(cameraRollUri, photoWidth, photoHeight)
    if (diskLocation) {
      await attachmentActions.createAttachment(
        this.props.attachable_type,
        this.props.attachable_mobile_id,
        diskLocation
      )
      markEdited(this.props.attachable_type, this.props.attachable_mobile_id)
      this.props.backFunction(this.props.backFunctionStack)
    }
  }

  render() {
    return(
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={{ flex: -1 }}>
            <Button
              buttonStyle={styles.tabButton}
              style={styles.tabButtonContainer}
              titleStyle={{ fontWeight: 'bold', fontSize: 14 }}
              backgroundColor={'#0287C3'}
              title="CANCEL"
              onPress={() => this.props.backFunction(this.props.backFunctionStack)}
            />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <FixedText style={styles.headerText}>Select a Photo</FixedText>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 5 }}>
              {
                this.state.photos.map((p, i) => {
                  return (
                    <TouchableOpacity
                      style={{ flexBasis: '25%', padding: 5 }}
                      key={i}
                      onPress={() => {
                        if (this.props.attachLater) {
                          this.props.attachLater(p.node.image);
                          this.props.backFunction(this.props.backFunctionStack);
                        } else {
                          this.attachPhoto(p.node.image.uri, p.node.image.width, p.node.image.height)
                        }
                      }}
                    >
                      <Image style={{ width: '100%', height: 200 }} resizeMode='cover' source={{uri: p.node.image.uri}} />
                    </TouchableOpacity>
                  )
                })
              }
            </View>
            <View style={{ flex: -1, marginBottom: 10, alignItems: 'center' }}>
              <Button
                buttonStyle={[styles.tabButton, {width: 120}]}
                style={styles.tabButtonContainer}
                titleStyle={{ fontWeight: 'bold', fontSize: 14 }}
                backgroundColor={'#03A9F4'}
                title="LOAD MORE"
                disabled={ this.state.photos.length % 20 != 0 }
                onPress={this.loadMorePhotos}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F6'
  },

  topBar: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: '#ECEFF1',
    borderBottomWidth: 2,
    borderBottomColor: '#CFD8DC',
  },

  headerText: {
    marginLeft: -130,
    color: '#37474F',
    fontSize: 30,
  },

  tabButton: {
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0
  },

  tabButtonContainer: {
    width: 90,
    height: 40,
    marginLeft: 10,
    marginTop: 20,
    marginRight: 0
  },
});

CameraRollBrowser.propTypes = {
  backFunction: PropTypes.func.isRequired,
  attachable_type: PropTypes.string.isRequired,
};

