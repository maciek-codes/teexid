import { applyMiddleware, createStore } from "redux";
import { roomReducer } from "../reducers/roomReducer";
import thunk from 'redux-thunk'

export const store = createStore(roomReducer, applyMiddleware(thunk));

export default store;