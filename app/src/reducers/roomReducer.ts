export interface RoomState {
    status: 'joined' | 'loading' | 'not_joined'
    id: string
}

const initialState: RoomState = {
    status: 'not_joined',
    id: ''
}

export type Action = {type: 'room/join' | 'room/create' | 'room/enter', payload: any }

export const roomReducer = (
    state: RoomState = initialState,
    action: Action
): RoomState => {
  switch(action.type) {
      case 'room/join': {
        const idToJoin = action.payload;
        return {...state, status: 'loading'};
      }
      case 'room/create': {
        const room = action.payload;
        return {...state, status: 'loading'};
      }

      case 'room/enter': {
        const room = action.payload;
        return {...state, id: room.id, status: 'joined'};
      }
      default:
          return state;
  }
}
