import { Component } from 'react';
import PropTypes from 'prop-types';
import { launchImageLibrary } from 'react-native-image-picker';
import Orientation from 'react-native-orientation';
import { Area, FloorPlan, Pin } from '../database/models';
import attachmentActions from '../lib/attachmentActions';
import { Icon } from 'react-native-elements';
import { Alert, ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { EmptyMessage, LayerSvg, AreaBreadcrumbs, FloorPlanHeader } from '../components';

import realm from '../database/realm';
import { roundTo } from '../lib/numberHelpers';
import { WHITE, LIGHT_GREEN } from '../resources/styles/globals';
import Svg from 'react-native-svg';

class FloorPlanForm extends Component {
  constructor(props) {
    super(props);
    area = this.props.area;

    floorPlan = area.findFloorPlan ? area.findFloorPlan.toPlainObject() : {};
    floorPlanAttachment = floorPlan ? FloorPlan.attachment(floorPlan.mobile_id) : null;
    layers = area.findFloorPlan ? area.findFloorPlan.layers : {};

    // ////////// Dimensions Set up ////////////////
    const { width, height } = Dimensions.get('window');
    let touchWidth = 0;
    let touchHeight = 0;
    this.canvasHeight = height - 25 - 7.5 - 56.5 - 20 - 40; // - (25 topBar) - (7.5 * 2 padding) - 56.5(breadcrumb height) - 15(breadCrumb margin) - 40 (FloorPlanHeader & margin)
    this.canvasWidth = width - 120 - 15; // - (sidebar * 2 ) - (7.5 * 2 padding)

    if (floorPlan.width) {
      if (floorPlan.width > floorPlan.height) {
        touchWidth = this.canvasWidth;
        factor = touchWidth / floorPlan.width;
        touchHeight = parseInt(floorPlan.height * factor);

        // If adjusted height is still greater than canvasHeight
        if (touchHeight > this.canvasHeight) {
          touchHeight = this.canvasHeight;
          factor = touchHeight / floorPlan.height;
          touchWidth = parseInt(floorPlan.width * factor);
        }
      } else if (floorPlan.height >= floorPlan.width) {
        touchHeight = this.canvasHeight;
        factor = touchHeight / floorPlan.height;
        touchWidth = parseInt(floorPlan.width * factor);

        // If adjusted width is still greater than canvasWidth
        if (touchWidth > this.canvasWidth) {
          touchWidth = this.canvasWidth;
          factor = touchWidth / floorPlan.width;
          touchHeight = parseInt(floorPlan.height * factor);
        }
      }
    }
    // ////////// End Dimensions Set up ////////////

    this.state = {
      area,
      currentPin: {
        pinnable: props.currentPinnable,
        pinnable_type: props.currentPinnable.getClassName(),
        pinnable_sub_type: props.currentPinnableSubType,
        pin: props.currentPinnable.getPin(props.currentPinnableSubType),
      },
      floorPlan,
      layers,
      floorPlanAttachment,
      zoomScale: 1,
      iconSizeMultiplier: 1,
      touchWidth,
      touchHeight,
      enableScroll: true,
      visibility: {
        areas: true,
        fixtures: true,
        attachments: true,
        illuminance: true,
      },
      hasFloorPlanBelow: false,
      clickCount: 0,
    };

    this.setScrollEnabled = this.setScrollEnabled.bind(this);
    this.updateCurrentPin = this.updateCurrentPin.bind(this);
    this.setCurrentPinViaPinnable = this.setCurrentPinViaPinnable.bind(this);
    this.openCameraOptions = this.openCameraOptions.bind(this);
  }

  componentDidMount() {
    this.checkForChildrenFloorPlan();
  }

  async checkForChildrenFloorPlan() {
    try {
      const childrenMobileIds = await Area.getDescendantMobileIds(area);
      if (childrenMobileIds.length > 0) {
        const customFilter = childrenMobileIds.map(mobile_area_id => `mobile_area_id = ${mobile_area_id}`).join(' OR ');
        const childrenFloorPlan = await realm.objects('FloorPlan').filtered('active = true').filtered(customFilter);
        this.setState({ hasFloorPlanBelow: Object.keys(childrenFloorPlan).length > 0 });
      }
    } catch (e) {
      console.log('Error checking for children floor plan', e, e.stack);
    }
  }

  async setTouchableDimensions() {
    if (!this.state.floorPlan.width) { return; }
    const floorPlan = this.state.floorPlan;

    // Landscape Image
    if (floorPlan.width > floorPlan.height) {
      touchWidth = this.canvasWidth; // - (sidebar * 2 ) - (7.5 * 2 padding)
      factor = touchWidth / floorPlan.width;
      touchHeight = parseInt(floorPlan.height * factor);

      // If adjusted height is still greater than canvasHeight
      if (touchHeight > this.canvasHeight) {
        touchHeight = this.canvasHeight;
        factor = touchHeight / floorPlan.height;
        touchWidth = parseInt(floorPlan.width * factor);
      }

      // Portrait Image || Square Image
    } else if (floorPlan.height >= floorPlan.width) {
      touchHeight = this.canvasHeight;
      factor = touchHeight / floorPlan.height;
      touchWidth = parseInt(floorPlan.width * factor);

      // If adjusted width is still greater than canvasWidth
      if (touchWidth > this.canvasWidth) {
        touchWidth = this.canvasWidth;
        factor = touchWidth / floorPlan.width;
        touchHeight = parseInt(floorPlan.height * factor);
      }
    }

    await this.setState({ touchWidth, touchHeight });
  }

  async deleteFloorPlan() {
    if (!this.state.floorPlan) { return; }
    await this.state.area.findFloorPlan.deactivate();

    this.setState({
      floorPlanAttachment: null,
      floorPlan: {},
      currentPin: {
        pinnable: this.state.currentPin.pinnable,
        pinnable_type: this.state.currentPin.pinnable_type,
        pinnable_sub_type: this.state.currentPin.pinnable_sub_type,
        pin: null,
      },
    });
  }

  async saveFloorPlan(height = 0, width = 0) {
    const floorPlan = this.state.floorPlan;
    floorPlan.height = height;
    floorPlan.width = width;
    const preparedFloorPlan = await FloorPlan.saveToRealm(floorPlan, this.state.area);
    this.setState({
      floorPlan: preparedFloorPlan,
      height,
      width,
      layers: this.state.area.floor_plan.layers,
    });
  }

  async createFloorPlanAttachment(imageUri, height = 0, width = 0) {
    const diskLocation = await attachmentActions.cameraRollToDisk(imageUri, width, height, 90);
    await attachmentActions.createAttachment(
      'FloorPlan',
      this.state.floorPlan.mobile_id,
      diskLocation,
    );
    this.setState({ floorPlanAttachment: FloorPlan.attachment(this.state.floorPlan.mobile_id) });
    await this.setTouchableDimensions();
  }

  openCameraOptions() {
    Orientation.unlockAllOrientations(); // To prevent crash ios 10.3

    launchImageLibrary({ title: 'Mapping Image' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const assets = response?.assets ?? []
        if (assets.length > 0) {
          const asset = assets[0]
          this.saveFloorPlan(asset.height, asset.width);
          this.createFloorPlanAttachment(asset.uri, asset.height, asset.width);
        }
      }
      Orientation.lockToLandscape(); // To prevent crash ios 10.3
    });
  }

  async updateCurrentPin(mobileId) {
    const newCurrentPin = await realm.objects('Pin').filtered('mobile_id = $0', mobileId)[0];

    if (newCurrentPin.pinnable_type == 'Area') {
      this.setState({
        currentPin: {
          pinnable: newCurrentPin.pinnable,
          pinnable_type: newCurrentPin.pinnable_type,
          pinnable_sub_type: newCurrentPin.pinnable_sub_type,
          pin: newCurrentPin.active ? newCurrentPin : null,
        },
        area: newCurrentPin.pinnable,
      });
    } else if (newCurrentPin.pinnable_type == 'ExistingFixture') {
      this.setState({
        currentPin: {
          pinnable: newCurrentPin.pinnable,
          pinnable_type: newCurrentPin.pinnable_type,
          pinnable_sub_type: newCurrentPin.pinnable_sub_type,
          pin: newCurrentPin.active ? newCurrentPin : null,
        },
        area: newCurrentPin.pinnable.area,
      });
    } else if (newCurrentPin.pinnable_type == 'Attachment') {
      this.setState({
        currentPin: {
          pinnable: newCurrentPin.pinnable,
          pinnable_type: newCurrentPin.pinnable_type,
          pinnable_sub_type: newCurrentPin.pinnable_sub_type,
          pin: newCurrentPin.active ? newCurrentPin : null,
        },
        area: newCurrentPin.pinnable.attachable,
      });
    }
  }

  askForDelete() {
    if (!this.state.area.findFloorPlan) { return; }

    const titleMessage = 'Delete Mapping?';
    const subTitleMessage = `This will delete the Mapping and all of it(s) ${this.state.area.findFloorPlan.pins.length} pins.`;
    const deleteButton = {
      text: 'Delete',
      style: 'destructive',
      onPress: () => this.deleteFloorPlan(),
    };
    const cancelButton = { text: 'Cancel', style: 'cancel' };

    Alert.alert(
      titleMessage,
      subTitleMessage,
      [deleteButton, cancelButton],
      { cancelable: false },
    );
  }

  askForCreate(element, goBack) {
    if (this.state.currentPin.pinnable_type == 'Area' || this.state.currentPin.pinnable_type == 'Attachment') {
      if (this.state.currentPin.pin) {
        const titleMessage = 'Pin Already Exists';
        const subTitleMessage = `You may move the pin, but cannot create another for this ${this.state.currentPin.pinnable_type}.`;
        const cancelButton = { text: 'Cancel', style: 'cancel' };

        Alert.alert(
          titleMessage,
          subTitleMessage,
          [cancelButton],
          { cancelable: false },
        );
      } else {
        this.createPin(element, goBack);
      }
    } else {
      this.createPin(element, goBack);
    }
  }

  async createPin(element, goBack) {
    const { currentPin, area } = this.state;
    const strokeWidth = 2;

    if ((element.locationX) >= this.state.touchWidth) {
      xLocation = this.state.touchWidth - (strokeWidth);
    } else if ((element.locationX) < 0) {
      xLocation = strokeWidth;
    } else {
      xLocation = element.locationX;
    }

    if ((element.locationY) >= this.state.touchHeight) {
      yLocation = this.state.touchHeight - (strokeWidth);
    } else if ((element.locationY) < 0) {
      yLocation = strokeWidth;
    } else {
      yLocation = element.locationY;
    }

    x = roundTo(((xLocation / this.state.touchWidth) * 100), 2);
    y = roundTo(((yLocation / this.state.touchHeight) * 100), 2);

    pin = {
      coordinate: `(${x},${y})`,
      pinnable_type: currentPin.pinnable_type,
      pinnable_sub_type: currentPin.pinnable_sub_type,
      pinnable_id: currentPin.pinnable.server_id,
      mobile_pinnable_id: currentPin.pinnable.mobile_id,
    };

    const newPin = await Pin.saveToRealm(pin, this.state.floorPlan.mobile_id);

    if (goBack) {
      if (currentPin.pinnable_type == 'Area' || currentPin.pinnable_type == 'Attachment') {
        this.props.changeEditingArea(area);
      } else if (currentPin.pinnable_type == 'ExistingFixture') {
        this.props.editAreaProduct(currentPin.pinnable);
      }
    } else {
      this.updateCurrentPin(newPin.mobile_id);
    }
  }

  setZoomRef = (node) => { // the ScrollView has a scrollResponder which allows us to access more methods to control the ScrollView component
    if (node) {
      this.zoomRef = node;
      this.scrollResponderRef = this.zoomRef.getScrollResponder();
    }
  }

  async setZoomScale(event) {
    this.setState({ zoomScale: event.zoomScale });
  }

  async setZoom(amount) {
    const iconSizeMultiplier = this.state.iconSizeMultiplier + amount;
    if (iconSizeMultiplier > 1.5) {
      await this.setState({ iconSizeMultiplier: 1.5 });
    } else if (iconSizeMultiplier < 0.25) {
      await this.setState({ iconSizeMultiplier: 0.25 });
    } else {
      await this.setState({ iconSizeMultiplier });
    }
  }

  setScrollEnabled() {
    const set = !this.state.enableScroll;
    this.setState({ enableScroll: set });
  }

  async layerVisibility(layerType) {
    const visibility = this.state.visibility;
    visibility[layerType] = !visibility[layerType];
    this.setState({ visibility });
  }

  startDelayCounter(nativeEvent) {
    let tick = 0;
    this.doubleClickInterval = setInterval(() => {
      tick += 1;
      if (tick == 1) {
        this.setState({ clickCount: 0 }); // needs to be setState so component reacts
        this.askForCreate(nativeEvent, null);
      }
    }, 250);
  }

  handleTap(e) {
    // DOUBLE TAP
    if (this.state.clickCount == 1) {
      this.setState({ clickCount: 0 });
      this.askForCreate(e.nativeEvent, 'goBack');
      clearInterval(this.doubleClickInterval);

      // SINGLE TAP
    } else {
      this.setState({ clickCount: 1 });
      this.startDelayCounter(e.nativeEvent);
    }
  }

  alertAreaCopy(nativeEvent) {
    let successButton = {};
    let cancelButton = {};
    let titleMessage = '';
    let subTitleMessage = '';

    if (this.state.currentPin.pinnable.floor_plan) {
      titleMessage = "Can't Copy Top Level Areas";
      subTitleMessage = 'You can copy any sub-area to this area.';
      cancelButton = { text: 'Cancel', style: 'cancel' };
    } else if (this.state.currentPin.pinnable_sub_type != 'location') {
      titleMessage = "Can't Copy Illuminance Readings";
      cancelButton = { text: 'Cancel', style: 'cancel' };
    } else {
      titleMessage = 'Copy Area?';
      subTitleMessage = `Copy area (${this.state.currentPin.pinnable.name}) and place copy at this coordinate.`;
      successButton = {
        text: 'Copy',
        style: 'default',
        onPress: () => this.createCopy(nativeEvent),
      };
      cancelButton = { text: 'Cancel', style: 'cancel' };
    }

    Alert.alert(
      titleMessage,
      subTitleMessage,
      Object.keys(successButton).length > 0 ? [successButton, cancelButton] : [cancelButton],
      { cancelable: false },
    );
  }

  askForCopy(nativeEvent) {
    const className = this.state.currentPin.pinnable_type;

    if (className == 'Area') {
      this.alertAreaCopy(nativeEvent);
    } else if (className == 'ExistingFixture') {
      this.createPin(nativeEvent, null);
    } else if (className == 'Attachment') {
      titleMessage = "Can't Copy an Attachment";
      subTitleMessage = 'Please add your attachment via the area or inventory form.';
      cancelButton = { text: 'Cancel', style: 'cancel' };

      Alert.alert(
        titleMessage,
        subTitleMessage,
        [cancelButton],
        { cancelable: false },
      );
    }
  }

  async createCopy(nativeEvent) {
    const { currentPin } = this.state;

    if (currentPin.pinnable_type == 'Area') {
      const copyAreaId = await currentPin.pinnable.createCopy();
      const newlyCopiedArea = await realm.objects('Area').filtered('mobile_id = $0', copyAreaId)[0];
      this.setState({
        area: newlyCopiedArea,
        currentPin: {
          pinnable: newlyCopiedArea,
          pinnable_type: currentPin.pinnable_type,
          pinnable_sub_type: currentPin.pinnable_sub_type,
          pin: null,
        },
      });
    }

    this.createPin(nativeEvent, null);
  }

  async setCurrentPinViaPinnable(newCurrentPin) {
    this.setState({ currentPin: newCurrentPin });
  }

  render() {
    const {
      floorPlanAttachment,
      touchWidth,
      touchHeight,
      zoomScale,
      enableScroll,
      hasFloorPlanBelow,
      iconSizeMultiplier,
      visibility,
      currentPin,
      area,
    } = this.state;

    const {
      changeEditingArea,
      editAreaProduct,
      project,
    } = this.props;

    const ActionBar = () => (
      <View style={styles.actionBar}>
        <View>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.askForDelete()}
          >
            <Icon
              name={'trash'}
              iconStyle={{ color: WHITE }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.setZoom(0.10)}
          >
            <Icon
              name={'search-plus'}
              iconStyle={{ color: WHITE }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.setZoom(-0.10)}
          >
            <Icon
              name={'search-minus'}
              iconStyle={{ color: WHITE }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.layerVisibility('areas')}
          >
            <Icon
              name={'object-group'}
              iconStyle={{ color: visibility.areas ? LIGHT_GREEN : 'tomato' }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.layerVisibility('fixtures')}
          >
            <Icon
              name={'lightbulb-o'}
              iconStyle={{ color: visibility.fixtures ? LIGHT_GREEN : 'tomato' }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.layerVisibility('attachments')}
          >
            <Icon
              name={'picture-o'}
              iconStyle={{ color: visibility.attachments ? LIGHT_GREEN : 'tomato' }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => this.layerVisibility('illuminance')}
          >
            <Icon
              name={'sun-o'}
              iconStyle={{ color: visibility.illuminance ? LIGHT_GREEN : 'tomato' }}
              size={25}
              type={'font-awesome'}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{ paddingVertical: 15 }}
          onPress={() => {
            const className = currentPin.pinnable_type;
            if (className == 'Area' || className == 'Attachment') {
              changeEditingArea(area);
            } else if (className == 'ExistingFixture') {
              editAreaProduct(currentPin.pinnable);
            }
          }}
        >
          <Icon
            name={'arrow-right'}
            iconStyle={{ color: WHITE }}
            size={25}
            type={'font-awesome'}
          />
        </TouchableOpacity>
      </View>
    );

    if (hasFloorPlanBelow) {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFD' }}>
              <EmptyMessage
                header="Floorplan already exists in a subarea."
                message="You will need to delete the floorplan from subarea."
                button={{
                  buttonAction: () => changeEditingArea(area),
                  buttonIcon: 'arrow-right',
                }}
              />
            </View>
          </View>
        </View>
      );
    }

    if (floorPlanAttachment) {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, paddingHorizontal: 7.5, paddingBottom: 7.5 }}>
              <View style={{ height: 56.5, marginVertical: 10 }}>
                <AreaBreadcrumbs
                  project={project}
                  area={area}
                  changeEditingArea={changeEditingArea}
                />
              </View>
              <FloorPlanHeader
                currentPin={currentPin}
                setCurrentPinViaPinnable={this.setCurrentPinViaPinnable}
                changeEditingArea={changeEditingArea}
                editAreaProduct={editAreaProduct}
              />
              <ScrollView
                onScroll={e => this.setZoomScale(e.nativeEvent)}
                bouncesZoom
                maximumZoomScale={4}
                minimumZoomScale={1}
                centerContent
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                ref={this.setZoomRef}
                scrollEventThrottle={16}
                style={{ overflow: 'hidden' }}
                canCancelContentTouches
                decelerationRate={'fast'}
                scrollEnabled={enableScroll}
                contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFD' }}
              >
                <View
                  style={{
                    width: touchWidth,
                    height: touchHeight,
                    position: 'relative',
                  }}
                >
                  <ImageBackground
                    source={{ uri: (floorPlanAttachment?.mobile_uri ?? "") != '' ? attachmentActions.getCorrectUri(floorPlanAttachment.mobile_uri) : "", static: true }}
                    imageStyle={{ width: touchWidth, height: touchHeight }}
                    style={{ width: touchWidth, height: touchHeight }}
                  >

                    <TouchableWithoutFeedback
                      style={{ flex: 1 }}
                      onPress={e => this.handleTap(e)}
                      onLongPress={(e) => {
                        if (!currentPin.pin) {
                          this.createPin(e.nativeEvent, null);
                        } else {
                          this.askForCopy(e.nativeEvent);
                        }
                      }}
                      delayLongPress={500}
                    >
                      <View style={{ flex: 1 }}>

                        <Svg width={touchWidth} height={touchHeight} viewBox={`0 0 ${touchWidth} ${touchHeight}`} preserveAspectRatio={'xMinYMin meet'}>
                          {this.state.layers.map(layer => (
                            <LayerSvg
                              key={layer.mobile_id}
                              layer={layer}
                              zoomScale={zoomScale}
                              touchHeight={touchHeight}
                              touchWidth={touchWidth}
                              setScrollEnabled={this.setScrollEnabled}
                              visibility={visibility}
                              iconSizeMultiplier={iconSizeMultiplier}
                              currentPin={currentPin}
                              changeEditingArea={changeEditingArea}
                              editAreaProduct={editAreaProduct}
                              updateCurrentPin={this.updateCurrentPin}
                            />
                          ))}
                        </Svg>

                      </View>
                    </TouchableWithoutFeedback>

                  </ImageBackground>
                </View>
              </ScrollView>
            </View>
            <ActionBar />
          </View>
        </View>
      );
    }

    // if there is no floor plan attachment
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, paddingHorizontal: 7.5, paddingBottom: 7.5 }}>
            <View style={{ height: 56.5, marginVertical: 10 }}>
              <AreaBreadcrumbs
                project={project}
                area={area}
                changeEditingArea={changeEditingArea}
              />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFD' }}>
              <EmptyMessage
                header="No Mapping"
                message="Press the button below to take one."
                button={{
                  buttonAction: this.openCameraOptions,
                  buttonIcon: 'camera-retro',
                  buttonText: 'camera',
                }}
              />
            </View>
          </View>
          <ActionBar />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionBar: {
    width: 60,
    padding: 2.5,
    backgroundColor: '#3E4D53',
    justifyContent: 'space-between',
  },
});

FloorPlanForm.propTypes = {
  project: PropTypes.object.isRequired,
  changeEditingArea: PropTypes.func.isRequired,
};

export default FloorPlanForm;
