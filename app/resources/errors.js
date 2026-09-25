/**
 * Errors are formatted to pass to Alert.alert and must take the form:
 *   { title: "Alert title", message: "Alert message" }
 *
 */

export const ERRORS = {

  apiRequestError: {
    title: "Something went wrong",
    message: "We had trouble logging you in. Please try again and contact support " +
             "if the problem continues."
  },

  missingAccount: {
    title: "No Account Found",
    message: "Sorry but we cannot find your account.\n\nIf you have a Retrolux account, " +
             "please check the email you entered for logging in. If you do not have an " +
             "account, please go to app.retrolux.com and create an account."
  },

  noPassword: {
    title: "Authentication Issue",
    message: "Sorry but you don't have a password set in our system yet. Please follow " +
             "the steps below and contact support if the problem continues.\n\n1. Go to " +
             "app.retrolux.com\n2. Log out if you are logged in\n3. Enter in your email " +
             "and click 'Next'\n4. Click the 'password issues?' button\n5. Follow the " +
             "instructions to reset your password\n6. Log in to the mobile app again once " +
             "your password is set"
  },

  missingToken: {
    title: "Authentication Issue",
    message: "Sorry but we experienced an issue authenticating your account. Please try " +
             "again and contact support if the problem continues."
  },

  missingCompany: {
    title: "Company Missing",
    message: "Sorry but before you can log in you need to create your company at " +
             "app.retrolux.com and then try again."
  },

  missingData: {
    title: "Data Missing",
    message: "Sorry but we experienced an issue pulling down required data. Please try again " +
             "and contact support if the problem continues."
  },

  upSyncFail: {
    title: "Error encountered",
    message: "We weren't able to complete the sync to app.retrolux.com. Please try again " +
             "and contact support if the problem continues."
  },

  initialRefreshFail: {
    title: "Error encountered",
    message: "We weren't able to set up some required data. Please try again " +
             "and contact support if the problem continues."
  },
}
