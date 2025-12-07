let offlineCallback = () => {};
let onlineCallback = () => {};

export const connectivity = {
  goOffline: () => offlineCallback(),
  goOnline: () => onlineCallback(),
  subscribe: ({ onOffline, onOnline }) => {
    offlineCallback = onOffline;
    onlineCallback = onOnline;
  },
};
