export const ACCESS_TOKEN = 'access_token';
export const PREVIOUS_TOKEN = 'previous_token';
export const LAST_SUCCESSFUL_SYNC_AT = 'last_successful_sync_at';
export const EXISTING_CATEGORY_TYPES = 'existing_category_types';
export const DEVICE_SERVER_ID = 'device_server_id';
export const BUILD_VERSION = '1.0.4';

// DEVELOPMENT - LOCAL ---------------------------------------------------------
// export const ENVIRONMENT_URL = 'http://localhost:3000';
// export const AWS_BUCKET = 'retrolux-s3';
// export const AWS_REGION = 'us-east-1'; // US West (Oregon)

// TESTING - DEV ---------------------------------------------------------------
// export const ENVIRONMENT_URL = 'https://dev.retrolux.com';
// export const AWS_BUCKET = 'retrolux-s3';
// export const AWS_REGION = 'us-east-1'; // US East (N. Virginia)

// // TESTING - BETA ---------------------------------------------------------------
// export const ENVIRONMENT_URL = 'https://beta.retrolux.com';
// export const AWS_BUCKET = 'retrolux-s3';
// export const AWS_REGION = 'us-east-1'; // US West (N. California)

// PRODUCTION - LIVE -----------------------------------------------------------
export const ENVIRONMENT_URL = 'https://app.retrolux.com';
export const AWS_BUCKET = 'retrolux-s3';
export const AWS_REGION = 'us-east-1'; // US East (N. Virginia)
export const AWS_ACCESS_KEY = ENV['AWS_ACCESS_KEY'];
export const AWS_SECRET_KEY = ENV['AWS_SECRET_KEY'];
