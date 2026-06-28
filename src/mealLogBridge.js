// Bridge so the menu (FullDayPlanScreen, a tab) can open the existing add-food
// flows (camera / manual) scoped to a specific meal, and be told the calories
// that were logged so it can compensate that meal in the plan.
let _opener = null;

export const registerMealLogger = (fn) => { _opener = fn; };
// openMealLog(mealKey, label, onLogged) — onLogged(calories) fires after a successful add.
export const openMealLog = (mealKey, label, onLogged) => {
  if (_opener) _opener(mealKey, label, onLogged);
};
