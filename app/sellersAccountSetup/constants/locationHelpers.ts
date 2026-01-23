// Hierarchical location helpers - wraps the new state-based structure
import {
  COUNTRIES_WITH_STATES_AND_CITIES,
  getStatesForCountry,
  getCitiesForState,
} from './formOptions';

export const getStatesOrCitiesForCountry = (countryCode: string): string[] => {
  // This replaces getCitiesForCountry - now returns states
  return getStatesForCountry(countryCode);
};

export const getCitiesForStateAndCountry = (countryCode: string, stateName: string): string[] => {
  // This gets cities for a given state
  return getCitiesForState(countryCode, stateName);
};

export const getAllCountriesOptions = () => {
  return Object.entries(COUNTRIES_WITH_STATES_AND_CITIES).map(([code, data]) => ({
    value: code,
    label: data.label,
  }));
};