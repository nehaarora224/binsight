// Visual tokens shared by the screens. App data comes from the API (see api.js).

export const TONE = {
  green: { bg: '#E6F2EA', fg: '#1E6B3A', bd: '#B9D6C3' },
  amber: { bg: '#FCF1DC', fg: '#8A5A0B', bd: '#EDD3A0' },
  red: { bg: '#FBEAE8', fg: '#A12F28', bd: '#EFC7C2' },
  redSolid: { bg: '#B0362E', fg: '#fff', bd: '#B0362E' },
  blue: { bg: '#E8EEF6', fg: '#2C5282', bd: '#C7D4E6' },
  grey: { bg: '#EEF0F3', fg: '#3A4658', bd: '#D8DDE4' },
};

export const LEVEL_TONE = { LOW: TONE.green, MEDIUM: TONE.amber, HIGH: TONE.red, OVERFLOW: TONE.redSolid };
export const LEVEL_BAR = { LOW: '#1E6B3A', MEDIUM: '#B7791F', HIGH: '#B0362E', OVERFLOW: '#B0362E' };
export const LEVEL_TEXT = { LOW: '#1E6B3A', MEDIUM: '#8A5A0B', HIGH: '#A12F28', OVERFLOW: '#A12F28' };
export const PRIORITY_TONE = { LOW: TONE.green, NORMAL: TONE.amber, URGENT: TONE.redSolid };

export const STOP_STYLE = {
  done: { marker: '#1E6B3A', tone: TONE.green, label: 'Completed' },
  pending: { marker: '#2C4A6E', tone: TONE.grey, label: 'Pending' },
  high: { marker: '#B0362E', tone: TONE.red, label: 'HIGH PRIORITY' },
};

/** 'done' | 'high' | 'pending' — how a point is drawn on the route. */
export const stopState = p => (p.status === 'done' ? 'done' : p.priority === 'high' ? 'high' : 'pending');

export const TITLES = {
  report: ['Report waste point', 'कचरा बिंदु रिपोर्ट करें'],
  route: ["Today's route", 'आज का मार्ग'],
  reports: ['My reports', 'मेरी रिपोर्ट'],
  more: ['More', 'अधिक'],
};
