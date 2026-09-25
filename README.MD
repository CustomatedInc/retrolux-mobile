# 🚀 Retrolux Mobile

## 📖 Description
This project is related with area management.

## 🔧 Installation Guide
Installation steps to run the code:

1. First of all, switch to the `rn-upgrade` branch. All code is upgraded into this branch.
2. A pull request has been made to the `develop` branch from `rn-upgrade` as well.
3. Required versions to run this code:
   - 🔹 Node v18.18.0
   - 🔹 Npm 9.8.1
   - 🔹 Yarn 3.6.4
4. Delete the following files:
   - `node_modules` folder
   - `package-lock.json`
   - `yarn.lock`
   - `Podfile.lock`
5. Navigate to the `ios/` folder and run:
   ```sh
   pod deintegrate
   ```
6. Run the following command to install dependencies:
   ```sh
   npm i -f
   ```
7. Your `node_modules` will be installed.
8. Navigate to the `ios/` folder and run:
   ```sh
   pod install
   ```
9. Open the project in Xcode:
   - Navigate to the `ios` folder and open `RetroluxMobile.xcworkspace`.
   - Xcode will open; select your device and start running the project using the Run button.
10. Start the packager using the following command from the root of the project:
    ```sh
    npx react-native start --reset-cache
    ```
11. Once the app is installed on your device, open the app.
12. When the packager files are loaded into the app, it should run successfully.

## ⚙️ Configuration
Mention any environment variables or settings that need to be configured.

## 🌍 Deployment
Instructions for deploying the project to a live server.

## 📜 License
Copyright (C) 2026 Retrolux.

Retrolux Mobile is free software licensed under the **GNU Affero General Public
License, version 3 or later (AGPL-3.0-or-later)**. You may redistribute and/or
modify it under those terms. It is distributed WITHOUT ANY WARRANTY. The full
license text is in the [LICENSE](LICENSE) file; see <https://www.gnu.org/licenses/>.

Third-party components (React Native and the packages in `package.json`) remain
under their own licenses, all of which are compatible with the AGPL. See
[NOTICE](NOTICE).

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for how contributions are licensed
(inbound = outbound, AGPL-3.0), the DCO sign-off requirement, secret-handling
rules, and the test/lint gate. Report security issues privately per
[SECURITY.md](SECURITY.md).

## 📬 Contact
Include contact details or links for support and feedback.


