// General helper functions

export function formatLargeNumber(number) {
  if (!number && number === 0) { return "0" }

  if (!number) { return }
  var parts = number.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export async function validatePercentage(number) {
  return !isNaN(number) && (number >= 0 && number <= 100);
}

export function increment(number) {
  const newNumber = parseNumberInput(number);
  return newNumber + 1;
}

export function decrement(number) {
  let newNumber = parseNumberInput(number);
  newNumber = (newNumber - 1 < 0) ? 0 : newNumber - 1;
  return newNumber;
}

export function parseNumberInput(number) {
  if (number === '' || number === null) {
    return 0;
  } else {
    return parseInt(number);
  }
}

export function isNumber(string) {
  return !isNaN(string) && !(String(string).includes('.'));
}

export function isNonzeroNumber(string) {
  return !isNaN(string) && string !== 0 && string !== '0';
}

export function isFloat(string) {
  return !isNaN(string);
}

export function isPresent(number) {
  return (!!number || number == 0)
}

export function isIntegerGreaterThanZero(string) {
  const regex = /^\d+$/
  if (regex.test(string) || !string ) { 
    return true
  } else { return false }
}

export function isNumberGreaterThanZero(string) {
  const regex = /^(0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*)$/
  if (regex.test(string) || string == '0' || !string ) { 
    return true
  } else { return false }
}

export function truncateString(str, limit){
  if (!str) { return '' }
  if (str.length <= limit) {
    return str
  } else {
    return str.toString().substring(0,limit) + '...';
  }
};

export function isEmpty(obj) { 
  for (var x in obj) { return false; }
  return true;
};

export function presentOrZero(value) {
  if (typeof value == 'string') {
    let numberize = Number(value);

    if (numberize || numberize == 0) {
      return true
    } else {
      return false
    }
  }

  if (typeof value == 'number') {
    if (value || value == 0) {
      return true
    } else {
      return false
    }
  }

  return false;
}

export function titleize(str) {
  if (!str) { return '' }
  let value = str.replace(/_/g, ' ');
  let words = value.split(' ');
  words = words.map(word => {
    word = word.charAt(0).toUpperCase() + word.substring(1);
    return word;
  });
  return words.join(' ');
}

export function roundTo(n, digits) {
  var negative = false;
  if (digits === undefined) {
    digits = 0;
  }

  if (n < 0) {
    negative = true;
    n = n * -1;
  }

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator).toFixed(11));
  n = (Math.round(n) / multiplicator).toFixed(2);
  if (negative)  {    
    n = (n * -1).toFixed(2);
  }

  return n;
}

export function succ(input) {
  var alphabet = 'abcdefghijklmnopqrstuvwxyz',
      length = alphabet.length,
      result = input,
      i = input.length;
      
  while(i >= 0) {
      var last = input.charAt(--i),
          next = '',
          carry = false;
      
      if (isNaN(last)) {
          index = alphabet.indexOf(last.toLowerCase());
          
          if (index === -1) {
              next = last;
              carry = true;
          }
          else {
              var isUpperCase = last === last.toUpperCase();
              next = alphabet.charAt((index + 1) % length);
              if (isUpperCase) {
                  next = next.toUpperCase();
              }
              
              carry = index + 1 >= length;
              if (carry && i === 0) {
                  var added = isUpperCase ? 'A' : 'a';
                  result = added + next + result.slice(1);
                  break;
              }
          }
      }
      else {
          next = +last + 1;
          if(next > 9) {
              next = 0;
              carry = true
          }
          
          if (carry && i === 0) {
              result = '1' + next + result.slice(1);
              break;
          }
      }
      
      result = result.slice(0, i) + next + result.slice(i + 1);
      if (!carry) {
          break;
      }
  }
  return result;
}