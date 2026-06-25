// Tiny bridge so the tutorial overlay can open the real "add food" sheet that
// lives inside TabNavigator. TabNavigator registers the opener on mount.
let _opener = null;

export const registerAddOpener = (fn) => { _opener = fn; };
export const openAddSheet = () => { if (_opener) _opener(); };
