export interface RoomState {
    status: 'joined' | 'not_joined'
    id: string
}

const initialState: RoomState = {
    status: 'not_joined',
    id: ''
}

export type Action = {type: 'JOIN', payload: any }

export const roomReducer = (
    state: RoomState = initialState,
    action: Action
): RoomState => {
  switch(action.type) {
      case 'JOIN': {
          const room = action.payload;
          return {...state, id: room.id, status: 'joined'};
      }
      default:
          return state;
  }
}