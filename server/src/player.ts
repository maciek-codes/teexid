import { PlayerStatus, Card } from "@teexid/shared";

const SECONDS_INACTIVE = 30;

export class Player {
  constructor(public readonly id: string) {}

  private _name: string;
  private _lastSeen: number = Date.now();
  private _cards: Card[] = [];
  get name() {
    return this._name;
  }

  set name(v: string) {
    this._name = v;
  }

  get lastSeen() {
    return this._lastSeen;
  }
  set lastSeen(date) {
    this._lastSeen = date;
  }

  /** Cards that were dealt to that player */
  public get cardsDealt(): Card[] {
    return this._cards;
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

  public get inactive() {
    return Date.now() - this._lastSeen > SECONDS_INACTIVE * 1000;
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

  public removeCard(cardId: number) {
    const index = this._cards.findIndex((c) => c.cardId === cardId);
    if (index !== -1) {
      this._cards.splice(index, 1);
    }
  }
}
