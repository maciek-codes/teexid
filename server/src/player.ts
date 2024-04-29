import { PlayerStatus, Card } from "@teexid/shared";

export class Player {
  constructor(public readonly id: string) {}

  private _name: string;
  private _cards: Card[] = [];
  get name() {
    return this._name;
  }

  set name(v: string) {
    this._name = v;
  }

  private _roomId: string;
  get roomId(): string {
    return this._roomId;
  }
  set roomId(v: string) {
    this._roomId = v;
  }

  private _points: number = 0;
  public get points(): number {
    return this._points;
  }
  public set points(v: number) {
    this._points = v;
  }

  private _ready: boolean;
  public get ready(): boolean {
    return this._ready;
  }
  public set ready(v: boolean) {
    this._ready = v;
  }

  private _status: PlayerStatus = "unknown";
  public get status() {
    return this._status;
  }
  public set status(v: PlayerStatus) {
    this._status = v;
  }

  public dealCards(cards: Card[]) {
    this._cards.push(...cards);
  }
}
