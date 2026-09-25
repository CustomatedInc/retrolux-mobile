import {NativeModules} from 'react-native';
import Reactotron from 'reactotron-react-native';
import {reactotronRedux} from 'reactotron-redux';
import url from 'url';

const reactotron = Reactotron.configure({name: 'RetroluxMobile'}) // Initial configuration
  .useReactNative({}) // Appling React-Native plugin
  .connect(); // Connect to local client

console.tron = Reactotron.logImportant;

export default reactotron;
