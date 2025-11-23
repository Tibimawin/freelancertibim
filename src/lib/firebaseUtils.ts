/**
 * Utility functions for Firebase data handling
 */

/**
 * Check if a value is a Date object
 */
function isDateObject(value: any): boolean {
  return value instanceof Date || 
         (typeof value === 'object' && value !== null && value.constructor?.name === 'Date');
}

/**
 * Check if a value is a plain object (not Date, Array, or other special objects)
 */
function isPlainObject(value: any): boolean {
  return typeof value === 'object' && 
         value !== null && 
         !Array.isArray(value) && 
         !isDateObject(value) &&
         value.constructor === Object;
}

/**
 * Remove undefined, null values and optionally empty strings from an object
 * This prevents Firestore errors when trying to save undefined values
 * 
 * @param obj - Object to clean
 * @param removeEmptyStrings - Whether to remove empty strings (default: false)
 * @returns Cleaned object without undefined/null values
 */
export function cleanFirebaseData<T extends Record<string, any>>(
  obj: T,
  removeEmptyStrings: boolean = false
): Partial<T> {
  const cleaned: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // Skip undefined and null
      if (value === undefined || value === null) {
        continue;
      }

      // Skip empty strings if requested
      if (removeEmptyStrings && value === '') {
        continue;
      }

      // Recursively clean nested objects
      if (isPlainObject(value)) {
        const cleanedNested = cleanFirebaseData(value, removeEmptyStrings);
        // Only add if nested object has properties
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } 
      // Clean arrays by filtering out undefined/null values
      else if (Array.isArray(value)) {
        const cleanedArray = value
          .filter(item => item !== undefined && item !== null)
          .map(item => {
            if (isPlainObject(item)) {
              return cleanFirebaseData(item, removeEmptyStrings);
            }
            return item;
          });
        
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray;
        }
      }
      // Add primitive values and Dates
      else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
}

/**
 * Validate that an object doesn't contain undefined values
 * Throws an error if undefined values are found
 * 
 * @param obj - Object to validate
 * @param objectName - Name of the object for error messages
 * @throws Error if undefined values are found
 */
export function validateNoUndefined(obj: Record<string, any>, objectName: string = 'Object'): void {
  const undefinedFields: string[] = [];

  function checkObject(o: any, prefix: string = '') {
    for (const key in o) {
      if (o.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = o[key];

        if (value === undefined) {
          undefinedFields.push(fullKey);
        } else if (isPlainObject(value)) {
          checkObject(value, fullKey);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (item === undefined) {
              undefinedFields.push(`${fullKey}[${index}]`);
            } else if (isPlainObject(item)) {
              checkObject(item, `${fullKey}[${index}]`);
            }
          });
        }
      }
    }
  }

  checkObject(obj);

  if (undefinedFields.length > 0) {
    throw new Error(
      `${objectName} contains undefined values in fields: ${undefinedFields.join(', ')}`
    );
  }
}

/**
 * Convert empty strings to null for optional fields
 * Useful for form data where empty strings should be treated as null
 * 
 * @param obj - Object to convert
 * @returns Object with empty strings converted to null
 */
export function emptyStringsToNull<T extends Record<string, any>>(obj: T): T {
  const converted: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value === '') {
        converted[key] = null;
      } else if (isPlainObject(value)) {
        converted[key] = emptyStringsToNull(value);
      } else if (Array.isArray(value)) {
        converted[key] = value.map(item => {
          if (isPlainObject(item)) {
            return emptyStringsToNull(item);
          }
          return item === '' ? null : item;
        });
      } else {
        converted[key] = value;
      }
    }
  }

  return converted;
}
