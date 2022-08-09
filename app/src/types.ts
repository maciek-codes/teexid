
// Web socket response
export type ResponseMsg<T> = {
    type: string,
    payload: T 
};

export type ErrorPayload = {
    type: string,
    message :string
}
