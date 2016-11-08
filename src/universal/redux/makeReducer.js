import {combineReducers} from 'redux';
import {cashayReducer} from 'cashay';
import notifications from 'universal/modules/notifications/ducks/notifications';
import {reducer as formReducer, actionTypes} from 'redux-form';
import auth, {DEFAULT_AUTH_REDUCER_NAME} from './authDuck';
import {reducer as storageReducer} from 'redux-storage-whitelist-fn';
import storageMerger from 'universal/redux/storageMerger';
import makeRootReducer from 'universal/redux/rootDuck';
import menuReducer from 'universal/modules/menu/ducks/menuDuck';
import outcomeCardReducer from 'universal/modules/outcomeCard/ducks/outcomeCardDuck';

const {SET_SUBMIT_SUCCEEDED} = actionTypes;

// wipe the value clean when submitted
const wipeAfterSuccess = (formToClear) => (state, action) => {
  if (action.type === SET_SUBMIT_SUCCEEDED) {
    if (action.meta.form === formToClear) {
      return undefined;
    }
  }
  return state;
};

const clearMeAfterSubmit = ['agendaInput', 'inviteTeamMember'];

const formPluginFactory = (clearMeAfterSubmit) => {
 return clearMeAfterSubmit.reduce((formPlugin, name) => {
   formPlugin[name] = wipeAfterSuccess(name);
   return formPlugin;
 }, {})
};

const formPlugin = formPluginFactory(clearMeAfterSubmit);

const appReducers = {
  [DEFAULT_AUTH_REDUCER_NAME]: auth,
  cashay: cashayReducer,
  form: formReducer.plugin(formPlugin),
  menu: menuReducer,
  notifications,
  outcomeCard: outcomeCardReducer
};


export default (newReducers) => {
  Object.assign(appReducers, newReducers);
  const appReducer = combineReducers({...appReducers});
  const rootReducer = makeRootReducer(appReducer);
  return storageReducer(rootReducer, storageMerger);
};
