/**
 * Convert dates with time to ISO String
 * @param {String} fieldContent Date string
 * @return {String}
 */
export const mapDateField = (fieldContent: string) => {
  if (fieldContent && fieldContent.length > 10) {
    return new Date(fieldContent).toISOString();
  }

  return fieldContent;
};
