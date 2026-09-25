export function utcNow() {
  let now = new Date;
  let utcNow = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));
  return utcNow
}

export function dateString(utcDateObject) {
  if (!utcDateObject) { return '' }
  // Set to Local Time
  let localDate = new Date(utcDateObject.getTime()+utcDateObject.getTimezoneOffset()*60*1000);
  let localOffset = utcDateObject.getTimezoneOffset() / 60;
  let localHours = utcDateObject.getHours();
  localDate.setHours(localHours - localOffset);

  // Convert into readable string for user
  let year = localDate.getUTCFullYear()
  let month = localDate.getUTCMonth() + 1;
  month = month < 10 ? `0${month}` : month

  let day = localDate.getUTCDate()
  day = day < 10 ? `0${day}` : day
  let hours = localDate.getUTCHours()
  let amPm = hours > 12 ? 'pm' : 'am'
  let minutes = localDate.getUTCMinutes()
  minutes = minutes < 10 ? `0${minutes}` : minutes

  return year + "-" + month + "-" + day + " " + hours + ":" + minutes + " " + amPm;
}