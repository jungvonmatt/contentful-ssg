import { Locale } from '../types';

export interface ErrorEntry {
  spaceId: string;
  environmentId: string;
  entryId: string;
  contentTypeId: string;
  locale: Locale;
  missingFields: string[];
}

export class ValidationError extends Error {
  missingFields: string[];
  link: string;
  entryId: string;
  contentTypeId: string;
  locale: string;
  constructor(entry: ErrorEntry) {
    const message = `ValidationError: Invalid entry ${entry.entryId} for locale ${entry.locale.name}`;
    super(message);
    this.link = `https://app.contentful.com/spaces/${entry.spaceId}/environments/${entry.environmentId}/entries/${entry.entryId}`;
    this.entryId = entry.entryId;
    this.contentTypeId = entry.contentTypeId;
    this.locale = entry.locale.code;
    this.missingFields = entry.missingFields;
    this.name = 'ValidationError';
  }
}
