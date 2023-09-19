export class User {
  constructor(public email: string, public id: string, private _token: string, private _tokerExpirationDate: Date) {}

  get token() {
    if (!this._tokerExpirationDate || new Date() > this._tokerExpirationDate) {
      return null;
    }
    return this._token;
  }
}
